import Groq from 'groq-sdk';
import { pool } from '../config/database';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export const generateAutoReply = async (
  matchId: string,
  senderId: string,
  senderMessage: string,
): Promise<string> => {
  try {
    // Get context: who is the other user in this match?
    const matchResult = await pool.query<{
      other_id: string;
      other_first_name: string;
      other_last_name: string;
      other_bio: string | null;
      other_interests: string | null;
      sender_first_name: string;
    }>(
      `SELECT
         u_other.id AS other_id,
         u_other.first_name AS other_first_name,
         u_other.last_name AS other_last_name,
         u_other.bio AS other_bio,
         u_other.interests AS other_interests,
         u_sender.first_name AS sender_first_name
       FROM matches m
       JOIN users u_other ON u_other.id = CASE
         WHEN m.user_a_id = $2 THEN m.user_b_id ELSE m.user_a_id END
       JOIN users u_sender ON u_sender.id = $2
       WHERE m.id = $1`,
      [matchId, senderId],
    );

    if (!matchResult.rowCount) {
      return 'Interesante, cuéntame más sobre eso.';
    }

    const { other_first_name, other_bio, other_interests, sender_first_name } = matchResult.rows[0];

    // Get recent messages for context (last 7, excluding the just-sent message)
    const recentMessages = await pool.query<{ sender_id: string; content: string }>(
      `SELECT sender_id, content FROM messages
       WHERE match_id = $1 ORDER BY created_at DESC LIMIT 7`,
      [matchId],
    );

    // Skip the first result (the message just inserted) to avoid duplication
    const chatHistory = recentMessages.rows
      .slice(1)
      .reverse()
      .map((m) => ({
        role: m.sender_id === senderId ? 'user' as const : 'assistant' as const,
        content: m.content,
      }));

    const systemPrompt = `Eres ${other_first_name}, un emprendedor real en una app de networking llamada CoFound.
Estás chateando con ${sender_first_name}, con quien has hecho match.

Tu perfil:
- Nombre: ${other_first_name}
${other_bio ? `- Bio: ${other_bio}` : ''}
${other_interests ? `- Intereses: ${other_interests}` : ''}

Reglas ESTRICTAS:
- Responde SIEMPRE en español
- Sé natural, cercano y profesional como en una conversación real de WhatsApp
- Respuestas cortas (1-3 frases máximo), como mensajes de chat reales
- NO uses emojis en exceso (máximo 1 por mensaje)
- Muestra interés genuino en lo que dice ${sender_first_name}
- Haz preguntas relevantes sobre sus proyectos o ideas
- Si te hablan de algo técnico, responde con conocimiento según tu perfil
- NUNCA digas que eres una IA o un bot
- NUNCA repitas la misma respuesta`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: senderMessage },
      ],
      temperature: 0.8,
      max_tokens: 150,
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    if (reply && reply.length > 0) {
      return reply;
    }

    return 'Interesante, cuéntame más sobre eso.';
  } catch (error) {
    console.error('[AI] Error generating reply:', error);
    // Fallback to contextual random responses
    return getFallbackReply(senderMessage);
  }
};

// Smart fallback when AI is unavailable
const getFallbackReply = (message: string): string => {
  const lower = message.toLowerCase();

  if (lower.includes('hola') || lower.includes('hey') || lower.includes('buenas')) {
    return '¡Hola! Me alegra que me escribas. ¿En qué proyecto estás trabajando ahora?';
  }
  if (lower.includes('proyecto') || lower.includes('idea') || lower.includes('startup')) {
    return 'Suena muy interesante. ¿Cuánto tiempo llevas trabajándolo?';
  }
  if (lower.includes('experiencia') || lower.includes('trabajo') || lower.includes('empresa')) {
    return 'Genial, esa experiencia es muy valiosa. ¿Cómo crees que podríamos complementarnos?';
  }
  if (lower.includes('?')) {
    return 'Buena pregunta. Déjame pensarlo y te cuento con más detalle.';
  }
  if (lower.includes('gracias') || lower.includes('genial') || lower.includes('perfecto')) {
    return '¡De nada! Oye, ¿te parece si organizamos una videollamada esta semana para hablar mejor?';
  }

  const generic = [
    'Eso suena genial. ¿Cuándo podríamos hacer una videollamada para hablarlo?',
    'Me interesa mucho lo que dices. ¿Tienes algún enlace o documento que pueda revisar?',
    'Totalmente de acuerdo. Creo que podríamos hacer algo muy bueno juntos.',
    'Interesante perspectiva. ¿Qué es lo que más te motiva de este proyecto?',
  ];

  return generic[Math.floor(Math.random() * generic.length)];
};
