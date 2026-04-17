import { useState, useRef, useCallback } from 'react';
import { Check, Copy, Upload, X, Loader } from 'lucide-react';

const FORM_URL = import.meta.env.VITE_FORM_URL ?? 'http://localhost:5173';
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

const DEFAULT_COLOR = '#0C79C1';

function buildFormUrl(color: string, logoUrl: string): string {
  const params = new URLSearchParams();
  if (color && color !== DEFAULT_COLOR) params.set('color', color);
  if (logoUrl) params.set('logo', logoUrl);
  const qs = params.toString();
  return qs ? `${FORM_URL}?${qs}` : FORM_URL;
}

function buildEmbedCode(url: string): string {
  return `<iframe\n  src="${url}"\n  width="100%"\n  height="100%"\n  style="border: none; min-height: 600px;"\n  title="Bizcap loan application"\n></iframe>`;
}

export function Configurator() {
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [hexInput, setHexInput] = useState(DEFAULT_COLOR);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    } catch {
      setUploadError('Upload failed. Please try again or paste a URL instead.');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlInput = (val: string) => {
    setLogoUrlInput(val);
    setLogoUrl(val);
    setUploadError('');
  };

  const clearLogo = () => {
    setLogoUrl('');
    setLogoUrlInput('');
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = () => {
    const url = buildFormUrl(color, logoUrl);
    setPreviewUrl(url);
    setGeneratedUrl(url);
    setCopiedUrl(false);
    setCopiedEmbed(false);
    if (iframeRef.current) iframeRef.current.src = url;
  };

  const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const embedCode = generatedUrl ? buildEmbedCode(generatedUrl) : '';

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">
      {/* Header */}
      <header className="border-b border-[#E5E7EB] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold text-[#111827]">Form Configurator</h1>
            <p className="text-[13px] text-[#6B7280]">Customise the Bizcap application form</p>
          </div>
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
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">

          {/* Controls panel */}
          <div className="flex flex-col gap-6">

            {/* Brand colour */}
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
              <h2 className="mb-4 text-[15px] font-semibold text-[#111827]">Primary colour</h2>
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
                  className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono text-[14px] text-[#111827] focus:border-[#0C79C1] focus:outline-none focus:ring-2 focus:ring-[#0C79C1]/10"
                  aria-label="Hex colour code"
                />
                <button
                  type="button"
                  onClick={() => { setColor(DEFAULT_COLOR); setHexInput(DEFAULT_COLOR); }}
                  className="shrink-0 rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]"
                >
                  Reset
                </button>
              </div>
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
            </section>

            {/* Logo */}
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
              <h2 className="mb-1 text-[15px] font-semibold text-[#111827]">Logo</h2>
              <p className="mb-4 text-[13px] text-[#6B7280]">Upload a file or paste a URL. Leave blank to use the default Bizcap logo.</p>

              {/* Upload zone */}
              <div
                className="relative mb-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-6 text-center transition-colors hover:border-[#0C79C1] hover:bg-blue-50/40"
                onClick={() => fileInputRef.current?.click()}
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
                <span className="text-[12px] text-[#9CA3AF]">PNG, JPG, SVG — max 10MB</span>
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

              {uploadError && (
                <p className="mt-2 text-[12px] text-[#DC2626]">{uploadError}</p>
              )}

              {/* Preview thumbnail */}
              {logoUrl && !uploading && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                  <img src={logoUrl} alt="Logo preview" className="h-8 max-w-[120px] object-contain" />
                  <span className="truncate text-[12px] text-[#6B7280]">Logo uploaded</span>
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
            </section>

            {/* Generate */}
            <button
              type="button"
              onClick={handleGenerate}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#0C79C1] text-[15px] font-semibold text-white transition-colors hover:bg-[#0A6AAA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C79C1] focus-visible:ring-offset-2"
            >
              Generate preview
            </button>

            {/* Output */}
            {generatedUrl && (
              <section className="flex flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-6">
                <h2 className="text-[15px] font-semibold text-[#111827]">Your links</h2>

                <div>
                  <p className="mb-1 text-[12px] font-medium text-[#6B7280]">Shareable URL</p>
                  <div className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2">
                    <span className="flex-1 truncate font-mono text-[12px] text-[#374151]">{generatedUrl}</span>
                    <button
                      type="button"
                      onClick={() => void copyToClipboard(generatedUrl, setCopiedUrl)}
                      className="shrink-0 rounded p-1 text-[#6B7280] hover:text-[#111827]"
                      aria-label="Copy URL"
                    >
                      {copiedUrl ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-[12px] font-medium text-[#6B7280]">Embed code</p>
                  <div className="flex items-start gap-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2">
                    <pre className="flex-1 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-[#374151]">{embedCode}</pre>
                    <button
                      type="button"
                      onClick={() => void copyToClipboard(embedCode, setCopiedEmbed)}
                      className="mt-0.5 shrink-0 rounded p-1 text-[#6B7280] hover:text-[#111827]"
                      aria-label="Copy embed code"
                    >
                      {copiedEmbed ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Preview panel */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[#111827]">Preview</h2>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-medium text-[#0C79C1] hover:underline"
                >
                  Open in new tab →
                </a>
              )}
            </div>

            <div className="relative flex-1 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm" style={{ minHeight: '640px' }}>
              {previewUrl
                ? (
                  <>
                    <iframe
                      ref={iframeRef}
                      src={previewUrl}
                      title="Form preview"
                      className="h-full w-full"
                      style={{ minHeight: '640px', border: 'none' }}
                    />
                    {/* Overlay to block interaction */}
                    <div className="absolute inset-0" aria-hidden />
                  </>
                )
                : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center" style={{ minHeight: '640px' }}>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F4F6]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    </div>
                    <p className="text-[14px] font-medium text-[#374151]">No preview yet</p>
                    <p className="text-[13px] text-[#9CA3AF]">Set your colour and logo above, then click <strong>Generate preview</strong></p>
                  </div>
                )
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
