const ADMIN_PASSWORD = '821760';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const { cnpj, senha } = JSON.parse(event.body);
    const cnpjClean = (cnpj || '').replace(/\D/g, '');

    if (cnpjClean === ADMIN_PASSWORD || senha === ADMIN_PASSWORD) {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, token: ADMIN_PASSWORD }),
      };
    }

    return {
      statusCode: 401,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'CNPJ ou senha inválidos.' }),
    };
  } catch (err) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Requisição inválida.' }) };
  }
};
