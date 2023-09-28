
# HakkuC2_web - WIP

Documentação Simples: Executando o Servidor e o Agent de Coleta de Dados


![Logo](https://animesher.com/orig/1/116/1162/11628/animesher.com_haku-dragn-studio-ghibli-chihiro-1162832.gif)


## Stack utilizada

**Front-end:** Reactjs, Nextjs, Bootstrap, SQLITE

**Back-end:** Nodejs, Elixir, Powershell, Bash



### Todo

Criar Dashboards
    
    [X] Login e Registro
    [x] Lista de maquinas
    [ ] Menus de opções

Interface de Comando e Controle

    [ ] RevShell
    [ ] Printscreen
    [X] Geolocalização
    [X] Status Machine 
    [ ] Agent Hibrido Windows/Linux

Codigo

    [] Encryptar passwords com bcrypt
    [] Fazer o servidor principal armazenar em um bancod de dados
    [] Correção dos agents
    
## Aprendizados

Eu tinha dificuldade pra lidar com Front-end, então alem de eu melhorar minhas habilidade com reactjs e tudo mais.

Tirando isso, atualmente eu estou pensando em como deixar nosso servidor mais robusto pra aguentar pelo menos umas 4000 mil maquinas, então vai ser uma aventura por ai.


## Documentação da API

#### Retorna todos os itens

```http
  GET localhost:3001/dados/
```

| Parâmetro   | Tipo       | Descrição                           |
| :---------- | :--------- | :---------------------------------- |
| `id` | `string` | Mostra todas as maquinas|

#### Retorna um item

```http
  GET localhost:3001/search-geo/:id
```

| Parâmetro   | Tipo       | Descrição                                   |
| :---------- | :--------- | :------------------------------------------ |
| `id`      | `string` | Faz a consulta de geolocalização  |

```http
  post localhost:3000/api/user/cadastro
```

| Parâmetro   | Tipo       | Descrição                                   |
| :---------- | :--------- | :------------------------------------------ |
| `id`      | `string` | cria usuario |

	"name":"admin",
	"email":"admin@hotmail.com",
	"password":"admin"

```http
  post localhost:3000/api/user/login
```

| Parâmetro   | Tipo       | Descrição                                   |
| :---------- | :--------- | :------------------------------------------ |
| `id`      | `string` | Faz autenticação do usuario |

	"email":"admin@hotmail.com",
	"password":"admin"