# Regola WAF Vercel — rate limit del feedback ospite

Questa è la **prima barriera** (al margine della rete) contro l'abuso del
modulo feedback, complementare al rate limit in-app di `src/lib/rate-limit.ts`
(seconda barriera, per-istanza). Ferma i POST anomali **prima** che la Server
Action parta, quindi prima di generare costi di esecuzione.

Chiude il punto 2 della review Codex (vedi `CLAUDE.md`, sezione problemi
pre-pilota): il limite in-memory si azzera ai cold start e non è distribuito;
il WAF conta lato Vercel per-regione e per-IP.

> ⚠️ Da applicare **a mano nella dashboard**: sul piano Hobby la regola non è
> versionabile via SDK (`@vercel/firewall` richiede Pro/Enterprise). Questo
> file è la fonte di verità: se la regola cambia, aggiornare **prima** qui.

## Perché aggancia i POST delle pagine guest (e non un `/api/...`)

Decisione del 2026-07-10 (vedi nota in `CLAUDE.md`): il feedback è una Server
Action, che fa `POST` al path della pagina ospite (`/<slug>`), non a un URL
dedicato. Oggi **l'unica mutazione pubblica** su quelle pagine è
`submitGuestFeedback`, perciò una regola sui POST verso le route guest colpisce
esattamente il feedback senza dover introdurre un endpoint `/api`. L'area
`/admin/*` è esclusa dalla condizione. Se in futuro si aggiunge un'altra Server
Action pubblica alle pagine guest, **rivalutare** questa regola oppure estrarre
il feedback in un endpoint dedicato.

## Come crearla (dashboard Vercel)

Progetto → **Firewall** → **Configure** → **+ New Rule**.

**Nome:** `Feedback ospite — rate limit`

**If (tutte le condizioni devono essere vere):**

| Campo (If)            | Operatore              | Valore     |
|-----------------------|------------------------|------------|
| Request Method        | Equals                 | `POST`     |
| Request Path          | Does not start with    | `/admin`   |
| Request Path          | Does not start with    | `/api`     |
| Request Path          | Does not start with    | `/_next`   |

> Le esclusioni `/api` e `/_next` sono cinture di sicurezza per il futuro:
> oggi gli ospiti non fanno POST lì, ma così la regola resta corretta anche se
> un domani si aggiungessero endpoint tecnici.

**Then → Rate Limit:**

| Parametro           | Valore                                            |
|---------------------|---------------------------------------------------|
| Limiting strategy   | **Fixed Window** (unica su Hobby)                 |
| Time Window         | **60s**                                           |
| Request Limit       | **10**                                            |
| Counting key        | **IP** (unica chiave utile su Hobby, oltre a JA4) |
| Action              | **Deny (429)**                                    |

Poi **Review Changes** → **Publish** (applica alla produzione).

### Perché questi numeri

Un ospite reale invia il feedback una o due volte in tutto. 10 POST in 60
secondi dallo stesso IP è già ben oltre l'uso umano: sotto quella soglia
nessun ospite viene mai toccato, sopra c'è quasi certamente uno script. Il
limite in-app resta più stretto e mirato (5 invii / 10 min per IP+struttura,
30 / ora per struttura): il WAF è la rete larga a monte, l'app quella fine a
valle.

Valori regolabili senza rischio: si può allargare la finestra fino a **10
minuti** (massimo su Hobby) alzando di conseguenza il limite, o iniziare con
azione **Log** per osservare il traffico qualche giorno prima di passare a
**Deny**.

## Verifica dopo la pubblicazione

Firewall → overview → seleziona la Custom Rule dal raggruppamento del traffico
e controlla che i POST bloccati compaiano come attesi. In alternativa, da un
terminale, ripetere >10 POST in un minuto verso una pagina guest e verificare
il `429`.

## Limiti noti (Hobby)

- Contatori **per-regione**: traffico distribuito su più regioni può superare
  il limite in una singola regione. Per il pilota è accettabile.
- **1 sola** regola di rate limit per progetto sul piano Hobby (max 3 regole
  firewall totali): questa è quella che vale la pena spendere.
