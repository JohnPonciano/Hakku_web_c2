import { cadastro } from "../../../services/user"

export default async function handler(req, res) {
  try {
    const newUser = await cadastro(req.body);
    res.status(201).json({ message: newUser.message });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
