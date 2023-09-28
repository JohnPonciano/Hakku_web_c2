import { login } from "../../../services/user"

export default async function handler(req, res) {
  try {
    console.log("Recebendo requisição de login:", req.body);
    const userToken = await login(req.body);
    console.log("Resposta de login:", userToken);

    if (userToken.success) {
      res.status(200).json({ message: 'Sessão iniciada', token: userToken.token });
    } else {
      res.status(404).json({ error: userToken.message });
    }
  } catch (err) {
    console.error("Erro no handler de login:", err);
    res.status(500).json({ error: 'Error interno do servidor' });
  }
}