// ─────────────────────────────────────────────────────────────────────────────
// Netlify Function : proxy sécurisé vers l'API Anthropic
// La clé API ne quitte JAMAIS ce fichier côté serveur.
// L'app React appelle /api/chat → cette fonction → Anthropic
// ─────────────────────────────────────────────────────────────────────────────

export default async (req) => {

  // 1. Autoriser uniquement les requêtes POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2. Vérifier que la clé API est bien configurée côté Netlify
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Clé API manquante. Configure ANTHROPIC_API_KEY dans les variables Netlify.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 3. Lire le corps de la requête envoyée par l'app
  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Corps de requête invalide.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { system, messages } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Messages manquants.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 4. Appeler l'API Anthropic avec la clé cachée
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       apiKey,               // ← clé injectée par Netlify, jamais visible
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system:     system || '',
        messages:   messages,
      }),
    })

    // 5. Retransmettre la réponse d'Anthropic vers l'app
    const data = await anthropicRes.json()

    return new Response(JSON.stringify(data), {
      status: anthropicRes.status,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: `Erreur serveur : ${err.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Route exposée par Netlify
export const config = { path: '/api/chat' }
