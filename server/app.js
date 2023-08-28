require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 3000


// models
const User = require("./models/User");
const Task = require("./models/Task")

// Config JSON response
app.use(express.json());

// Open Route
app.get("/", (req, res) => {
 return res.json({ success: true,message: "Bem vindo a API!" });
});

// Private Route
app.get("/auth/userCheck/:id", checkToken, async (req, res) => {
  const id = req.params.id;

  // check if user exists
  const user = await User.findById(id, "-password");

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

  res.status(200).json({ user });
});

function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ msg: "Acesso negado!" });

  try {
    const secret = process.env.SECRET;

    jwt.verify(token, secret);

    next();
  } catch (err) {
    res.status(400).json({ msg: "O Token é inválido!" });
  }
}

app.post("/auth/register", async (req, res) => {
  const { name, email, password, confirmpassword } = req.body;

  // validations
  if (!name) {
    return res.status(422).json({ msg: "O nome é obrigatório!" });

  }

  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
  }

  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória!" });
  }

  if (password != confirmpassword) {
    return res
      .status(422)
      .json({ msg: "A senha e a confirmação precisam ser iguais!" });
  }

  // check if user exists
  const userExists = await User.findOne({ email: email });

  if (userExists) {
    return res.status(422).json({ msg: "Por favor, utilize outro e-mail!" });
  }

  // create password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // create user
  const user = new User({
    name,
    email,
    password: passwordHash,
  });

  try {
    await user.save();

    res.status(201).json({ msg: "Usuário criado com sucesso!" });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
});

app.get("/auth/listUser/:username", async (req, res) => {
  const username = req.params.username;

  try {
    // Buscar usuário pelo nome de usuário
    const user = await User.findOne({ name: username }, "-password");

    if (!user) {
      return res.status(404).json({ msg: "Usuário não encontrado!" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
});



app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // validations
  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
  }

  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória!" });
  }

  // check if user exists
  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

  // check if password match
  const checkPassword = await bcrypt.compare(password, user.password);
  const userId = user.id;
  

  if (!checkPassword) {
    return res.status(422).json({ msg: "Senha inválida" });
  }

  try {
    const secret = process.env.SECRET;

    const token = jwt.sign(
      {
        id: user._id,
      },
      secret
    );
    

    res.status(200).json({ msg: "Autenticação realizada com sucesso!", token, userId});
  } catch (error) {
    res.status(500).json({ msg: error });
  }
});

//referente as task
app.post("/task/create", async (req, res) => {
  const { title, description , conclusion, status, userId } = req.body;

  // validations
  if (!title) {
    return res.status(422).json({ msg: "O titulo é obrigatório!" });
  }

  if (!description) {
    return res.status(422).json({ msg: "A descrição é obrigatoria" });
  }

  if (!conclusion) {
    return res.status(422).json({ msg: "A data de conclusão é obrigatória" });
  }
  if (!status) {
    return res.status(422).json({ msg: "O status é obrigatório!" });
  }
  if (!userId) {
    return res.status(422).json({ msg: "O userid é obrigatório" });
  }

  // create task
  const task = new Task({
    title,
    description,
    conclusion,
    status,
    userId
  });

  try {
    await task.save();

    res.status(201).json({ msg: "Tarefa criada com sucesso!" });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
});

app.get('/task/listAll/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const tasks = await Task.find({ userId }); // Busca as tarefas pelo userId
    res.json(tasks);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.post('/task/listStatus', async (req, res) => {
  const { userId, status } = req.body;
  try {
    const tasks = await Task.find({userId, status }); // Filtra por userId e status
    
    res.json(tasks);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

//Retirei o dotenv
const dbUser = 'Enzovp01';
const dbPassword = 'Teste123';

mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@cluster0.kvxkpcl.mongodb.net/`, { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    app.listen(port)
    console.log("Conectou ao banco!");

  })
  .catch((err) => console.log(err));