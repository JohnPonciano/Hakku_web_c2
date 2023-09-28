import React, { useState } from 'react';
import Link from 'next/link';
import { setCookie } from 'cookies-next'
import { useRouter } from 'next/router'

function Login() {
  const [form, setForm] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const router = useRouter()

  const handleChangeForm = (event, field) => {
    setForm({
      ...form,
      [field]: event.target.value
    })
  }

  const handleForm = async (e) => {
    e.preventDefault()

    if (!form.email) return setError('O e-mail é obrigatório')
    if (!form.password) return setError('a senha é obrigatório')

    setError('')
    try {
      const response = await fetch(`/api/user/login`, {
        method: 'POST',
        body: JSON.stringify(form)
      })

      const json = await response.json()
      console.log('object', json)
      console.log('Response completo',response)
      console.log('Response status',response.status)
      if (response.status !== 200){
        throw new Error(json.error)
      }
      else{
        console.log('Response passou',json)
        setCookie('authorization', json.token)
        console.log('token gerado',json.token)
        console.log('redirecionando /')
        router.push('/')}
        
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container mt-5" data-bs-theme="dark">
      <div className="row justify-content-center py-5" >
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">Hakku C2 - Login</div>
          <div className="card-body">
            <form >
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={form['email']} 
                  onChange={(event) => handleChangeForm(event, 'email')}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  value={form['password']} 
                  onChange={(event) => handleChangeForm(event, 'password')}
                  required
                />
              </div>
              <div className="d-flex justify-content-between">
                <button onClick={handleForm} className="btn btn-primary">
                  Login
                </button>
                {error && <p className="error">{error}</p>}
                <Link href="/register">Register Here</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
  }

export default Login;
