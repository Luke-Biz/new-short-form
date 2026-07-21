import { useState, useRef, useCallback, useEffect } from 'react';
import { Check, Copy, Upload, X, Loader, TriangleAlert, Monitor, Smartphone } from 'lucide-react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { contrastRatioWithWhite, MIN_UI_CONTRAST } from '../lib/colorUtils';
import { copyText, selectElementText } from '../lib/clipboard';

type CopyStatus = 'idle' | 'copied' | 'failed';

const FORM_URL = import.meta.env.VITE_FORM_URL ?? 'http://localhost:5173';
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

const DEFAULT_COLOR = '#0C79C1';
const DEFAULT_RADIUS = 8;

type ContactPreference = 'client' | 'broker';
type LogoMode = 'default' | 'custom' | 'none';

function buildFormUrl(
  color: string,
  logoMode: LogoMode,
  logoUrl: string,
  contact: ContactPreference,
  radius: number,
  showPoweredBy: boolean,
): string {
  const params = new URLSearchParams();
  if (color && color !== DEFAULT_COLOR) params.set('color', color);
  if (logoMode === 'none') params.set('logo', 'none');
  else if (logoMode === 'custom' && logoUrl) params.set('logo', logoUrl);
  if (contact === 'broker') params.set('contact', 'broker');
  if (radius !== DEFAULT_RADIUS) params.set('radius', String(radius));
  if (!showPoweredBy) params.set('poweredby', '0');
  const qs = params.toString();
  return qs ? `${FORM_URL}?${qs}` : FORM_URL;
}

/** Only the in-page preview iframe gets this - generated links never carry it. */
function withPreviewParam(url: string): string {
  return url.includes('?') ? `${url}&preview=1` : `${url}?preview=1`;
}

// Self-contained embed: the iframe plus a small listener that auto-sizes it to
// the form's content (the form posts its height via postMessage). height="800"
// is the pre-JS fallback. One paste, no extra setup for the partner.
function buildEmbedCode(url: string): string {
  const origin = (() => {
    try { return new URL(url).origin; } catch { return '*'; }
  })();
  return `<iframe
  id="bizcap-form"
  src="${url}"
  width="100%"
  height="800"
  style="border: none; width: 100%;"
  title="Bizcap loan application"
></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (${origin === '*' ? 'true' : `e.origin === '${origin}'`} &&
        e.data && e.data.type === 'bizcap-form-resize' &&
        typeof e.data.height === 'number') {
      var f = document.getElementById('bizcap-form');
      if (f) f.style.height = e.data.height + 'px';
    }
  });
</script>`;
}

const STORAGE_KEY = 'bizcap-configurator-v1';

type SavedConfig = {
  color?: string;
  logoUrl?: string;
  logoMode?: LogoMode;
  previewDevice?: 'desktop' | 'mobile';
  contactPreference?: ContactPreference;
  radius?: number;
  showPoweredBy?: boolean;
};

// localStorage can throw when embedded with third-party storage blocked
// (e.g. the CRM iframe) - persistence is best-effort.
function loadSavedConfig(): SavedConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedConfig) : {};
  } catch {
    return {};
  }
}

type StepHeadingProps = {
  step: number;
  title: string;
  className?: string;
};

function StepHeading({ step, title, className = 'mb-4' }: StepHeadingProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0C79C1] text-[12px] font-bold text-white">
        {step}
      </span>
      <h2 className="text-[15px] font-semibold text-[#111827]">{title}</h2>
    </div>
  );
}

export function Configurator() {
  const [saved] = useState(loadSavedConfig);
  const savedColor =
    saved.color && /^#[0-9A-Fa-f]{6}$/.test(saved.color) ? saved.color : DEFAULT_COLOR;

  const [color, setColor] = useState(savedColor);
  const [hexInput, setHexInput] = useState(savedColor);
  const [logoUrl, setLogoUrl] = useState(saved.logoUrl ?? ''); // validated - only URLs that actually loaded an image
  const [logoUrlInput, setLogoUrlInput] = useState(saved.logoUrl ?? '');
  const [logoMode, setLogoMode] = useState<LogoMode>(
    saved.logoMode ?? (saved.logoUrl ? 'custom' : 'default'),
  );
  const [logoCheckStatus, setLogoCheckStatus] = useState<'idle' | 'checking' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>(
    saved.previewDevice === 'mobile' ? 'mobile' : 'desktop',
  );
  const [contactPreference, setContactPreference] = useState<ContactPreference>(
    saved.contactPreference === 'broker' ? 'broker' : 'client',
  );
  const [radius, setRadius] = useState<number>(
    typeof saved.radius === 'number' && saved.radius >= 0 && saved.radius <= 24
      ? saved.radius
      : DEFAULT_RADIUS,
  );
  const [showPoweredBy, setShowPoweredBy] = useState<boolean>(saved.showPoweredBy !== false);
  const [urlCopyStatus, setUrlCopyStatus] = useState<CopyStatus>('idle');
  const [embedCopyStatus, setEmbedCopyStatus] = useState<CopyStatus>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlTextRef = useRef<HTMLAnchorElement>(null);
  const embedTextRef = useRef<HTMLPreElement>(null);

  // Link + embed code update instantly; the iframe reload is debounced so
  // colour-picker dragging and typing don't cause a reload storm.
  const formUrl = buildFormUrl(color, logoMode, logoUrl, contactPreference, radius, showPoweredBy);
  const previewUrl = useDebouncedValue(formUrl, 600);

  const lowContrast = contrastRatioWithWhite(color) < MIN_UI_CONTRAST;

  // Only flag a bad hex code once typing has settled, not on every keystroke.
  const debouncedHexInput = useDebouncedValue(hexInput, 800);
  const hexInvalid =
    debouncedHexInput === hexInput && !/^#[0-9A-Fa-f]{6}$/.test(hexInput);

  // Persist config so partners can come back and tweak later.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ color, logoUrl, logoMode, previewDevice, contactPreference, radius, showPoweredBy }),
      );
    } catch {
      // storage unavailable - skip persistence
    }
  }, [color, logoUrl, logoMode, previewDevice, contactPreference, radius, showPoweredBy]);

  // Validate pasted logo URLs by actually loading the image once typing settles.
  // Only URLs that load become the logo, so links never carry a broken image.
  const debouncedLogoInput = useDebouncedValue(logoUrlInput.trim(), 600);
  useEffect(() => {
    const url = debouncedLogoInput;
    if (!url) {
      setLogoUrl('');
      setLogoCheckStatus('idle');
      return;
    }
    if (url === logoUrl) return; // already validated (e.g. set by a successful upload)
    let cancelled = false;
    setLogoCheckStatus('checking');
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setLogoUrl(url);
      setLogoCheckStatus('idle');
    };
    img.onerror = () => {
      if (cancelled) return;
      setLogoUrl('');
      setLogoCheckStatus('error');
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [debouncedLogoInput, logoUrl]);

  const applyColor = useCallback((hex: string) => {
    const valid = /^#[0-9A-Fa-f]{6}$/.test(hex);
    if (!valid) return;
    setColor(hex);
    setHexInput(hex);
  }, []);

  const handleHexInput = (raw: string) => {
    const val = raw.startsWith('#') ? raw : `#${raw}`;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) setColor(val);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File is too large. Please upload an image under 2MB.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: fd },
      );
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json() as { secure_url: string };
      setLogoUrl(data.secure_url);
      setLogoUrlInput(data.secure_url);
      setLogoCheckStatus('idle');
    } catch {
      setUploadError('Upload failed. Please try again or paste a URL instead.');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlInput = (val: string) => {
    setLogoUrlInput(val);
    setUploadError('');
  };

  const clearLogo = () => {
    setLogoUrl('');
    setLogoUrlInput('');
    setLogoCheckStatus('idle');
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    setColor(DEFAULT_COLOR);
    setHexInput(DEFAULT_COLOR);
    setPreviewDevice('desktop');
    setContactPreference('client');
    setRadius(DEFAULT_RADIUS);
    setShowPoweredBy(true);
    setLogoMode('default');
    clearLogo();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable - nothing to clear
    }
  };

  const handleCopy = async (
    text: string,
    setStatus: (s: CopyStatus) => void,
    textEl: HTMLElement | null,
  ) => {
    const ok = await copyText(text);
    // If copy is blocked (e.g. CRM iframe without clipboard permission),
    // highlight the text so a manual Ctrl+C still works.
    if (!ok && textEl) selectElementText(textEl);
    setStatus(ok ? 'copied' : 'failed');
    window.setTimeout(() => setStatus('idle'), ok ? 2000 : 6000);
  };

  const embedCode = buildEmbedCode(formUrl);

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">
      {/* Header */}
      <header className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold text-[#111827]">Form Configurator</h1>
            <p className="text-[13px] text-[#6B7280]">
              Brand the application form with your colours and logo, then share your link - takes about a minute
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-[13px] text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]"
            >
              Start over
            </button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="120"
              height="16"
              viewBox="0 0 232.667 32.2"
              aria-label="Bizcap"
              role="img"
            >
            <path
              d="M50.821-45.56h0v6.267h5.4a2.9,2.9,0,0,0,2.809-3.026,2.783,2.783,0,0,0-2.809-3.026l-5.4-.216ZM44.554-20.924h0v-30.9H56.872c5.4,0,8.86,3.89,8.86,9.293a7.1,7.1,0,0,1-2.809,6.051,7.574,7.574,0,0,1,3.242,6.267,9.179,9.179,0,0,1-9.077,9.293Zm6.267-12.318h0v6.267h5.4A2.954,2.954,0,0,0,59.249-30a3.14,3.14,0,0,0-3.025-3.242Zm45.6,12.318H90.152v-30.9h6.267Zm44.086,0H119.759c3.674-8.212,7.348-16.64,11.238-24.852h-9.509v-6.051h18.8c-3.674,8.212-7.348,16.424-11.238,24.636h11.454v6.267ZM183.943-44.7a9.739,9.739,0,0,0-5.4-1.3c-12.318,0-12.318,18.8,0,18.8a18.147,18.147,0,0,0,6.051-1.3L185.456-22a17.61,17.61,0,0,1-6.7,1.3c-20.962,0-20.962-31.336,0-31.336a13.805,13.805,0,0,1,6.051,1.3l-.864,6.051ZM206.2-20.924h0l12.966-31.984h.648l12.966,31.984h-6.915l-1.081-3.242H214.63l-1.3,3.242ZM216.791-30h5.619L219.6-38Zm45.6,9.077h-6.267v-30.9h12.1c12.1,0,11.886,19.017,0,19.017h-6.051v11.886Zm0-17.721h5.4c4.106,0,4.106-6.915,0-6.915h-5.4Z"
              transform="translate(-44.554 52.908)"
              fill="#0c79c1"
            />
            </svg>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">

          {/* Controls panel */}
          <div className="flex flex-col gap-6">

            {/* Brand colour */}
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
              <StepHeading step={1} title="Colour & style" />
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#E5E7EB]">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => applyColor(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Pick a colour"
                  />
                  <div className="h-full w-full rounded-lg" style={{ backgroundColor: color }} />
                </div>
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => handleHexInput(e.target.value)}
                  maxLength={7}
                  placeholder="#0C79C1"
                  className={`w-full rounded-lg border px-3 py-2 font-mono text-[14px] text-[#111827] focus:outline-none focus:ring-2 ${
                    hexInvalid
                      ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/10'
                      : 'border-[#D1D5DB] focus:border-[#0C79C1] focus:ring-[#0C79C1]/10'
                  }`}
                  aria-label="Hex colour code"
                  aria-invalid={hexInvalid || undefined}
                />
                <button
                  type="button"
                  onClick={() => { setColor(DEFAULT_COLOR); setHexInput(DEFAULT_COLOR); }}
                  className="shrink-0 rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]"
                >
                  Reset
                </button>
              </div>
              {hexInvalid && (
                <p className="mt-2 text-[12px] text-[#DC2626]" role="alert">
                  That doesn&apos;t look like a valid colour code - it should be 6 characters, like #0C79C1.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {['#0C79C1', '#1D4ED8', '#7C3AED', '#DC2626', '#059669', '#D97706', '#111827'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => applyColor(c)}
                    title={c}
                    className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? c : 'transparent',
                      boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none',
                    }}
                    aria-label={c}
                  />
                ))}
              </div>
              {lowContrast && (
                <div
                  className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3"
                  role="alert"
                >
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                  <p className="text-[12px] leading-snug text-amber-800">
                    This colour may be hard to read - buttons on the form use white text.
                    A darker shade will be easier for your customers.
                  </p>
                </div>
              )}

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="radius-slider" className="text-[13px] font-medium text-[#374151]">
                    Corner roundness
                  </label>
                  <span className="text-[12px] tabular-nums text-[#6B7280]">{radius}px</span>
                </div>
                <input
                  id="radius-slider"
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full accent-[#0C79C1]"
                />
                <div className="mt-1 flex justify-between text-[11px] text-[#9CA3AF]">
                  <span>Square</span>
                  <span>Rounded</span>
                </div>
              </div>
            </section>

            {/* Logo */}
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
              <StepHeading step={2} title="Add your logo" className="mb-1" />
              <p className="mb-4 text-[13px] text-[#6B7280]">Choose what shows above the form.</p>

              <div
                className="mb-4 grid grid-cols-3 gap-1 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-1"
                role="radiogroup"
                aria-label="Logo option"
              >
                {([
                  { v: 'default', label: 'Bizcap logo' },
                  { v: 'custom', label: 'My logo' },
                  { v: 'none', label: 'No logo' },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    role="radio"
                    aria-checked={logoMode === opt.v}
                    onClick={() => setLogoMode(opt.v)}
                    className={`rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors ${
                      logoMode === opt.v
                        ? 'bg-white text-[#111827] shadow-sm'
                        : 'text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {logoMode === 'none' ? (
                <p className="text-[13px] text-[#6B7280]">No logo will appear above the form.</p>
              ) : null}

              {logoMode === 'default' ? (
                <p className="text-[13px] text-[#6B7280]">The standard Bizcap logo will appear above the form.</p>
              ) : null}

              {logoMode === 'custom' ? (
              <>
              {/* Upload zone */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload a logo image"
                className="relative mb-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-6 text-center transition-colors hover:border-[#0C79C1] hover:bg-blue-50/40 focus-visible:border-[#0C79C1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C79C1]/30"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) void handleFileUpload(file);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileUpload(f); }}
                />
                {uploading
                  ? <Loader className="h-5 w-5 animate-spin text-[#6B7280]" />
                  : <Upload className="h-5 w-5 text-[#9CA3AF]" />
                }
                <span className="text-[13px] text-[#6B7280]">
                  {uploading ? 'Uploading…' : 'Drag & drop or click to upload'}
                </span>
                <span className="text-[12px] text-[#9CA3AF]">PNG, JPG, SVG - max 2MB</span>
              </div>

              {/* URL input */}
              <div className="relative">
                <input
                  type="url"
                  value={logoUrlInput}
                  onChange={(e) => handleUrlInput(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full rounded-lg border border-[#D1D5DB] py-2 pl-3 pr-8 text-[14px] text-[#111827] focus:border-[#0C79C1] focus:outline-none focus:ring-2 focus:ring-[#0C79C1]/10"
                />
                {logoUrlInput && (
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#9CA3AF] hover:text-[#374151]"
                    aria-label="Clear logo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {logoCheckStatus === 'checking' && (
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                  <Loader className="h-3 w-3 animate-spin" aria-hidden />
                  Checking image…
                </p>
              )}
              {logoCheckStatus === 'error' && (
                <p className="mt-2 text-[12px] text-[#DC2626]" role="alert">
                  We couldn&apos;t load an image from that link - check the address, or upload the file instead.
                </p>
              )}
              {uploadError && (
                <p className="mt-2 text-[12px] text-[#DC2626]" role="alert">{uploadError}</p>
              )}

              {/* Preview thumbnail */}
              {logoUrl && !uploading && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-8 max-w-[120px] object-contain"
                    onError={() => {
                      setLogoUrl('');
                      setLogoCheckStatus('error');
                    }}
                  />
                  <span className="truncate text-[12px] text-[#6B7280]">Logo ready to use</span>
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="ml-auto shrink-0 rounded p-0.5 text-[#9CA3AF] hover:text-[#374151]"
                    aria-label="Remove logo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              </>
              ) : null}

              <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 border-t border-[#F3F4F6] pt-4">
                <span>
                  <span className="block text-[13px] font-medium text-[#374151]">
                    Show &ldquo;Powered by Bizcap&rdquo;
                  </span>
                  <span className="block text-[12px] text-[#6B7280]">
                    A small credit line below the form
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showPoweredBy}
                  onClick={() => setShowPoweredBy((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    showPoweredBy ? 'bg-[#0C79C1]' : 'bg-[#D1D5DB]'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      showPoweredBy ? 'translate-x-[22px]' : 'translate-x-[2px]'
                    }`}
                  />
                </button>
              </label>
            </section>

            {/* Contact preference */}
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
              <StepHeading step={3} title="Who should we contact?" className="mb-1" />
              <p className="mb-4 text-[13px] text-[#6B7280]">
                When an application comes in, who should Bizcap call about it?
              </p>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Contact preference">
                {([
                  {
                    value: 'client',
                    label: 'Contact my client directly',
                    hint: 'We speak to the applicant about their application',
                  },
                  {
                    value: 'broker',
                    label: 'Contact me (the broker)',
                    hint: 'We come to you with any updates',
                  },
                ] as const).map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] p-3 transition-colors ${
                      contactPreference === opt.value
                        ? 'border-[#0C79C1] bg-[#E8F4FD]'
                        : 'border-[#D1D5DB] hover:border-[#93C5FD]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="contact-preference"
                      value={opt.value}
                      checked={contactPreference === opt.value}
                      onChange={() => setContactPreference(opt.value)}
                      className="mt-1 accent-[#0C79C1]"
                    />
                    <span>
                      <span className="block text-[14px] font-medium text-[#111827]">{opt.label}</span>
                      <span className="block text-[12px] text-[#6B7280]">{opt.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* Output */}
            <section className="flex flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-6">
              <div>
                <StepHeading step={4} title="Share your form" className="mb-1" />
                <p className="text-[12px] text-[#6B7280]">Updates automatically as you customise.</p>
              </div>

              <div>
                <p className="text-[13px] font-semibold text-[#374151]">Shareable URL</p>
                <p className="mb-1.5 text-[12px] text-[#6B7280]">
                  Send this link straight to your customers - it opens your branded form in their browser.
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2">
                  <a
                    ref={urlTextRef}
                    href={formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 truncate font-mono text-[12px] text-[#0C79C1] hover:underline"
                  >
                    {formUrl}
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleCopy(formUrl, setUrlCopyStatus, urlTextRef.current)}
                    className="shrink-0 rounded p-1 text-[#6B7280] hover:text-[#111827]"
                    aria-label="Copy URL"
                  >
                    {urlCopyStatus === 'copied' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {urlCopyStatus === 'failed' && (
                  <p className="mt-1 text-[12px] text-amber-700" role="alert">
                    Automatic copy is blocked here - the link is highlighted for you, press
                    Ctrl+C (⌘C on Mac) to copy it.
                  </p>
                )}
              </div>

              <div>
                <p className="text-[13px] font-semibold text-[#374151]">Embed code</p>
                <p className="mb-1.5 text-[12px] text-[#6B7280]">
                  Shows the form on your own website. Copy this and paste it into your site - or send it
                  to whoever manages your website for you.
                </p>
                <div className="flex items-start gap-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2">
                  <pre ref={embedTextRef} className="flex-1 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-[#374151]">{embedCode}</pre>
                  <button
                    type="button"
                    onClick={() => void handleCopy(embedCode, setEmbedCopyStatus, embedTextRef.current)}
                    className="mt-0.5 shrink-0 rounded p-1 text-[#6B7280] hover:text-[#111827]"
                    aria-label="Copy embed code"
                  >
                    {embedCopyStatus === 'copied' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {embedCopyStatus === 'failed' && (
                  <p className="mt-1 text-[12px] text-amber-700" role="alert">
                    Automatic copy is blocked here - the code is highlighted for you, press
                    Ctrl+C (⌘C on Mac) to copy it.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Preview panel */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-[#111827]">Preview</h2>
              <div className="flex items-center gap-3">
                <div className="flex rounded-lg border border-[#E5E7EB] bg-white p-0.5" role="group" aria-label="Preview device">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    aria-pressed={previewDevice === 'desktop'}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors ${
                      previewDevice === 'desktop' ? 'bg-[#0C79C1] text-white' : 'text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" aria-hidden />
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    aria-pressed={previewDevice === 'mobile'}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors ${
                      previewDevice === 'mobile' ? 'bg-[#0C79C1] text-white' : 'text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" aria-hidden />
                    Mobile
                  </button>
                </div>
                <a
                  href={formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-medium text-[#0C79C1] hover:underline"
                >
                  Open in new tab →
                </a>
              </div>
            </div>

            <div
              className={`flex-1 overflow-hidden rounded-2xl border border-[#E5E7EB] shadow-sm ${
                previewDevice === 'mobile' ? 'flex justify-center bg-[#F3F4F6] py-6' : 'bg-white'
              }`}
              style={{ minHeight: '640px' }}
            >
              <iframe
                src={withPreviewParam(previewUrl)}
                title="Form preview"
                className={
                  previewDevice === 'mobile'
                    ? 'h-[700px] w-[390px] max-w-full rounded-2xl border border-[#E5E7EB] bg-white shadow-sm'
                    : 'h-full min-h-[640px] w-full'
                }
                style={{ border: previewDevice === 'mobile' ? undefined : 'none' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
