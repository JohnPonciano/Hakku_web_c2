import { insertUsuario, findUsuarioByEmail, findUsuarioByEmailAndPassword } from './database'; 
import { generateToken } from './jwt';

export async function cadastro(body) {
  try {
    const { name, email, password } = JSON.parse(body);

    
    const existingUser = await findUsuarioByEmail(email); 

    if (existingUser) {
      return { success: false, message: 'usuario_ja_cadastrado' };
    }

    
    await insertUsuario(name, email, password);

    const token = generateToken({ name, email });
    return { success: true, message: 'Usuario_Criado' ,token };
  } catch (err) {
    console.error('Error na funcao "cadastro":', err);
    return { success: false, message: 'error_general' };
  }
}

export async function login(body) {
  try {
    const { email, password } = JSON.parse(body);

    const user = await findUsuarioByEmailAndPassword(email, password); 

    if (!user) {
      return { success: false, message: 'usuario_nao_encontrado' };
    }

    const token = generateToken(user);
    return { success: true, token };
  } catch (err) {
    console.error('Error na funcao "login":', err);
    return { success: false, message: 'error_general' };
  }
}
