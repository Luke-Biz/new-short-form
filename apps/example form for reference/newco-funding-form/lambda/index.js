/**
 * BizmateUSShortFormPOSTLeadV2 — Lambda handler (reference copy, deployed manually).
 *
 * Routes:
 *   POST    → create lead in BizMate (variant 1 final submit, variant 2 step-1 create)
 *   PATCH   → update existing lead, body = { id, ...fields } (variant 2 final submit)
 *   OPTIONS → CORS preflight
 *
 * Before deploying:
 *   1. Re-insert the real BizMate token below (search for "{redacted}").
 *   2. Confirm CRM_UPDATE_URL matches BizMate's lead-update route (create is
 *      /api/v1/lead/new; the update route below is an assumption — verify verb + path).
 *   3. Ensure the API Gateway route accepts PATCH (or ANY), not just POST.
 *   4. After deploy, set API_PATCH_URL in src/constants.ts to the same URL as
 *      API_URL and republish the form (npm run webflow:share).
 */
const axios = require('axios');
const { DynamoDBClient, PutItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const COOL_DOWN_PERIOD_S = 60;

const DEFAULT_BROKER_ID = '761d335d-b3f3-4725-bb3d-18eaa33476b2';
const CRM_CREATE_URL = 'https://bizmate.fasttask.net/api/v1/lead/new';
// TODO: confirm against BizMate API docs before deploying.
const crmUpdateUrl = (id) => `https://bizmate.fasttask.net/api/v1/lead/${encodeURIComponent(id)}`;

const CRM_HEADERS = {
  Authorization: `Bearer {redacted}`, // ← re-insert the real token when deploying
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function log(level, type, message, data = {}) {
  console.log(JSON.stringify({
    level,
    type,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  }));
}

async function notifySlack(errorCategory, payload, pageUrl = 'Lambda') {
  const webhookUrl = 'https://hooks.slack.com/triggers/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';
  try {
    await axios.post(webhookUrl, {
      error_category: errorCategory,
      payload: JSON.stringify(payload, null, 2),
      page_url: pageUrl,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // never block on notification failure
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify(body),
  };
}

// Whitelisted form → CRM field mapping, shared by create and update so a public
// request can never write CRM-internal fields (status, owner, broker name, …).
function buildCrmFields(body) {
  return {
    firstName:               body.firstName               || null,
    lastName:                body.lastName                || null,
    phone:                   body.phone                   || null,
    email:                   body.email                   || null,
    companyName:             body.companyName             || null,
    companyNumber:           body.companyNumber           || null,
    businessType:            body.businessType            || null,
    amountRequested:         body.amountRequested         || null,
    averageMonthlyTurnover:  body.averageMonthlyTurnover  || null,
    industry:                body.industry                || null,
    businessStartDate:       body.businessStartDate       || null,
    notes:                   body.notes                   || null,
    // Contact-first variant sends 'No' on its step-1 create, 'Yes' on completion.
    applicationCompleted:    body.applicationCompleted === 'No' ? 'No' : 'Yes',
    thirdPartyMarketingConsent: body.thirdPartyMarketingConsent || null,
    brokerId:                body.brokerId                || null,
    brokerRepId:             body.brokerRepId             || null,
    brazeUserProfile:        body.brazeUserProfile        || null,
    suitableProducts: body.productType ? [body.productType] : null,
    // FlexOffers affiliate attribution: full refid → uen, publisher id → sfid
    uen:                     body.uen                     || null,
    sfid:                    body.sfid                    || null,
    utmSource:               body.utmSource               || null,
    utmMedium:               body.utmMedium               || null,
    utmCampaign:             body.utmCampaign             || null,
    utmTerm:                 body.utmTerm                 || null,
    utmContent:              body.utmContent              || null,
    utmMatchType:            body.utmMatchType            || null,
    utmDevice:               body.utmDevice               || null,
    gclid:                   body.gclid                   || null,
    fbclid:                  body.fbclid                  || null,
    gbraid:                  body.gbraid                  || null,
    msclkid:                 body.msclkid                 || null,
  };
}

function stripEmpty(fields) {
  return JSON.parse(JSON.stringify({ fields }, (_key, value) =>
    value === null || value === '' ? undefined : value
  ));
}

function extractApplicationLink(crmData) {
  return (
    crmData?.fields?.bankStatementsLinkPlaid ||
    crmData?.bankStatementsLinkPlaid ||
    crmData?.data?.bankStatementsLinkPlaid ||
    null
  );
}

function extractCrmLeadId(crmData) {
  return crmData?.fields?.id || crmData?.id || crmData?.data?.id || null;
}

async function handleCreate(body, email) {
  if (!body.firstName || !body.lastName) {
    log('WARN', 'VALIDATION_FAILURE', 'Required fields missing', { email });
    return json(400, { error: 'Required fields missing: firstName, lastName' });
  }

  // Dedup lock — taken before the CRM call to block concurrent double-submits,
  // released on CRM failure so a retry within the cooldown isn't silently dropped.
  let lockTaken = false;
  if (email) {
    try {
      // DynamoDB TTL deletion is lazy (can lag by minutes/hours), so an
      // existence check alone extends the cooldown far past 60 s. Treat a
      // stale lock as free by comparing timestamps instead.
      await ddb.send(new PutItemCommand({
        TableName: 'LeadSubmissionLocks',
        Item: {
          email:    { S: email },
          ts:       { N: String(Date.now()) },
          expireAt: { N: String(Math.floor(Date.now() / 1000) + COOL_DOWN_PERIOD_S) },
        },
        ConditionExpression: 'attribute_not_exists(email) OR #ts < :cutoff',
        ExpressionAttributeNames: { '#ts': 'ts' },
        ExpressionAttributeValues: { ':cutoff': { N: String(Date.now() - COOL_DOWN_PERIOD_S * 1000) } },
      }));
      lockTaken = true;
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        log('INFO', 'LEAD_DUPLICATE', 'Duplicate submission within cooldown window', {
          email,
          payload: body,
        });
        return json(200, { applicationLink: null, id: null });
      }
      log('ERROR', 'DYNAMO_FAILURE', 'DynamoDB error during dedup check', {
        email,
        error: err.message,
      });
      await notifySlack('dynamo_failure', { ...body, error: err.message });
      throw err;
    }
  }

  const cleanPayload = stripEmpty({
    ...buildCrmFields(body),
    brokerId: body.brokerId || DEFAULT_BROKER_ID,
    callClientOrBroker: 'Call Client',
    leadSource: 'Web - Apply',
    agreeToBizcapConsentPrivacy: 'Yes',
  });

  log('INFO', 'CRM_REQUEST', 'Sending payload to BizMate', {
    email,
    crmPayload: cleanPayload,
  });

  let crmResponse;
  try {
    crmResponse = await axios.post(CRM_CREATE_URL, cleanPayload, {
      timeout: 10000,
      headers: CRM_HEADERS,
    });
  } catch (error) {
    // Release the lock so the browser's retry isn't swallowed as a duplicate.
    if (lockTaken) {
      try {
        await ddb.send(new DeleteItemCommand({
          TableName: 'LeadSubmissionLocks',
          Key: { email: { S: email } },
        }));
      } catch {
        // best effort — worst case the user waits out the cooldown
      }
    }
    throw error;
  }

  const applicationLink = extractApplicationLink(crmResponse.data);
  const leadId = extractCrmLeadId(crmResponse.data);

  log('INFO', 'LEAD_CREATED', 'Lead successfully created in CRM', {
    email,
    crmStatus: crmResponse.status,
    applicationLink: applicationLink ? 'present' : 'absent',
    leadId: leadId ? 'present' : 'absent',
    crmResponse: crmResponse.data,
  });

  if (!applicationLink) {
    log('WARN', 'LEAD_NO_LINK', 'CRM accepted lead but returned no applicationLink', { email });
    await notifySlack('lead_no_link', { ...body });
  }

  return json(200, { applicationLink, id: leadId });
}

async function handleUpdate(body, email) {
  const leadId = body.id;
  if (!leadId || typeof leadId !== 'string') {
    log('WARN', 'VALIDATION_FAILURE', 'PATCH without lead id', { email });
    return json(400, { error: 'Missing lead id' });
  }

  // No dedup lock here: the create already locked this email, and an update
  // within the cooldown window is exactly the expected variant-2 flow.
  const cleanPayload = stripEmpty(buildCrmFields(body));

  log('INFO', 'CRM_UPDATE_REQUEST', 'Sending lead update to BizMate', {
    email,
    leadId,
    crmPayload: cleanPayload,
  });

  const crmResponse = await axios.patch(crmUpdateUrl(leadId), cleanPayload, {
    timeout: 10000,
    headers: CRM_HEADERS,
  });

  const applicationLink = extractApplicationLink(crmResponse.data);

  log('INFO', 'LEAD_UPDATED', 'Lead successfully updated in CRM', {
    email,
    leadId,
    crmStatus: crmResponse.status,
    applicationLink: applicationLink ? 'present' : 'absent',
    crmResponse: crmResponse.data,
  });

  return json(200, { applicationLink, id: leadId });
}

exports.handler = async (event) => {
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || '';
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    log('ERROR', 'PARSE_FAILURE', 'Failed to parse request body');
    await notifySlack('parse_failure', { rawBody: event.body?.slice(0, 500) });
    return json(400, { error: 'Invalid request body' });
  }

  const email = typeof body.email === 'string' ? body.email.toLowerCase() : null;

  log('INFO', httpMethod === 'PATCH' ? 'LEAD_UPDATE_RECEIVED' : 'LEAD_RECEIVED', 'Payload received', {
    method: httpMethod,
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    payload: body,
  });

  try {
    return httpMethod === 'PATCH'
      ? await handleUpdate(body, email)
      : await handleCreate(body, email);
  } catch (error) {
    const isCrmError = !!error.response;

    log('ERROR', isCrmError ? 'CRM_FAILURE' : 'LAMBDA_FAILURE',
      isCrmError ? 'BizMate API returned an error' : 'Unexpected Lambda error',
      {
        method: httpMethod,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        errorMessage: error.message,
        crmStatus: error.response?.status,
        crmBody: error.response?.data ? JSON.stringify(error.response.data) : undefined,
      }
    );

    await notifySlack(
      isCrmError ? `crm_${error.response?.status ?? 'error'}` : 'lambda_failure',
      {
        ...body,
        method: httpMethod,
        errorMessage: error.message,
        crmStatus: error.response?.status,
        crmBody: error.response?.data ? JSON.stringify(error.response.data) : undefined,
      }
    );

    return json(500, { error: 'An error occurred while processing the form.' });
  }
};
