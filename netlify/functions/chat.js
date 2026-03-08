// Netlify Function v1 — proxy sécurisé vers l'API Anthropic
// Syntaxe classique, compatible avec tous les environnements Netlify

export const handler = async (event) => {

  // Autoriser uniquement POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Méthode non autorisée' }),
    }
  }

  // Vérifier la clé API
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Clé API manquante dans les variables Netlify.' }),
    }
  }

  // Lire le corps
  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Corps de requête invalide.' }),
    }
  }

  const { system, messages } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Messages manquants.' }),
    }
  }

  // Appeler Anthropic
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system:     system || '',
        messages:   messages,
      }),
    })

    const data = await response.json()

    return {
      statusCode: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Erreur serveur : ${err.message}` }),
    }
  }
}
