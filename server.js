//////////////////////////////////////////////////////////////////////////////////////
//Importa as bibliotecas que teremos que usar
const express = require('express')
const ejs = require("ejs")
var path = require('path')
const app = express();
var http = require('http');
require('dotenv').config()
const emailValidator = require('deep-email-validator');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); //Diz para o express para utilizar a pasta public
app.set('view engine','ejs') //Diz para o express para utilizar ejs como a view engine padrão
//////////////////////////////////////////////////////////////////////////////////////
//TUDO RELACIONADO AO PASSPORT
const passport = require("passport");
var passaport_google = require("./auth/passaport_config");
var passaport_facebook = require("./auth/facebook_config.js");
//////////////////////////////////////////////////////////////////////////////////////
//Tudo relacionado ao Bcrypt
const bcrypt = require("bcrypt") //Require o bcrypt
//////////////////////////////////////////////////////////////////////////////////////
//TUDO RELACIONADO AO CHATGPT
const axios = require('axios');
const openai = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer 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`,
  },
});
//////////////////////////////////////////////////////////////////////////////////////
//Tudo relacionado ao banco de dados
const mongoose = require('mongoose')
const Usuario = require('./Models/Usuario')
const User = require('./Models/User')
const url = 'mongodb+srv://law_assistant:UB31FgBAHAfwxl65@beta.cgeqtcq.mongodb.net/Site'
const dbNome = 'Beta'
const db = mongoose.connection
//////////////////////////////////////////////////////////////////////////////////////
//CONFIGURAÇÃO DOS COOKIES

//////////////////////////////////////////////////////////////////////////////////////
//FUNÇÕES GERAIS  
  //Confere se o email existe utilizando a API email validator
 async function isEmailValid(email) {
  const {valid} = await emailValidator.validate(email)
  return valid
}
function verifyAuthToken(req, res, next) {
  const secret = process.env.SECRET
  const authToken  = req.cookies.auth
  //Verifica se o token é valido
  jwt.verify(authToken, secret, function (err, decoded) {      
    if (err) {
      return res.status(401).send({ message: 'Authentication failed! Please try again :(' });
    }
    // save to request object for later use
    req.userId = decoded.id;
    next();
  });
}

//MANDA O REQUEST PRO CHATPGT E RETORNA A RESPOSTA
async function createChatCompletion(messages, options = {}) {
  try {
    const response = await openai.post("/chat/completions", {
      model: options.model || "gpt-3.5-turbo",
      messages,
      ...options,
    });

    return response.data.choices;
  } catch (error) {
    console.error("Error creating chat completion:", error);
  }
}
//////////////////////////////////////////////////////////////////////////////////////
//REGISTRO
  //Exibe a pagina de registro, com ou sem mensagem de erro dependendo da variavel status
  function home_registra(req,res){
    if(req.status){
      res.render('pages/registro.ejs',{teste: req.status});  
    }else{
      res.render('pages/registro.ejs',{teste: 0});
    }       
  }
  //Faz a conferencia se os dados digitados no formulario estão corretos
  //Caso não estejam escreve a mensagem de erro em "status" e passa para home_registra (atraves do next)
  async function registra(req, res, next){

    if(req.body.hasOwnProperty("logar")){
      return res.redirect("/login")
     }

    var name = req.body.name
    var email = req.body.email
    var senha = req.body.password
    var confirma_senha = req.body.confirmpassword

    if (name == "" || email == ""  || senha == "" || confirma_senha == "") {
      req.status= "Por favor, preencha todos os campos!"
      return next();
    }
    if (name.length < 2) {
      req.status="Nome invalido!"
      return next();
    }
    if (email.length < 5) {
      req.status="Email invalido!"
      return next();
    }
    if (senha.length < 8) {
      req.status="A senha deve conter no minimo 8 caracteres"
      return next();
    }
    if (senha != confirma_senha) {
      req.status="As senhas devem ser iguais"
      return next();
    }
    
    if( await isEmailValid(email) == false ){
      req.status="Email invalido! [Validator]"
      return next();
    }

    //Confere se o email ja esta cadastrado 
    var usuario_existe = await Usuario.findOne({ email: req.body.email})

    if(usuario_existe){ 
      req.status="Email ja cadastrado"
      return next();      
    }

    //Confere se o celular ja esta cadastrado 
     usuario_existe = await Usuario.findOne({ telefone: req.body.phone})

    if(usuario_existe){ 
      req.status="Celular ja cadastrado"
      return next();      
    }
    
   //Confere se o email ja esta cadastrado pelo google
   var usuario_existe = await User.findOne({ "google.email": req.body.email})

   if(usuario_existe){ 
     req.status="Email ja cadastrado por um conta google"
     return next();      
   }
   
      //Caso não tenha erros salva no banco e redireciona para a pagina de login
      // Gera um salt aleatório
      var saltRounds = 10; 
      var salt = bcrypt.genSaltSync(saltRounds);
      // criar o hash bcrypt da senha usando o salt gerado
      var hash = bcrypt.hashSync(req.body.password, salt);
      //Cria um novo usuario
      var novo_usuario = new Usuario({
        nome: name,
        email: req.body.email,
        telefone: req.body.phone,
        senha: hash,
        salt: salt
      })

      //Tenta salvar no banco de dados
      try{          
        await novo_usuario.save()
      }catch(error){
        console.log(error)
      }

    res.redirect('/login')
  }
  //GET, é chamado quando abrimos a rota /registro, chama home_registra
  app.get('/registro',home_registra)
  //POST, é chamado quando escrevemos dados em /registro, chama registra e depois home_registra
  app.post('/registro',registra,home_registra)
//////////////////////////////////////////////////////////////////////////////////////
//LOGIN
//Exibe a pagina de login, com ou sem mensagem de erro dependendo da variavel status
  function home_login(req,res){
    if(req.status){
      res.render('pages/login.ejs',{teste: req.status});  
    }else{
      res.render('pages/login.ejs',{teste: 0});
    }       
  }
  //Faz a conferencia se os dados digitados no formulario estão corretos
  //Caso não estejam escreve a mensagem de erro em "status" e passa para home_login (atraves do next)
  async function login(req, res, next){

    if(req.body.hasOwnProperty("facebook")){
      return res.redirect("/auth/facebook")
     }

    if(req.body.hasOwnProperty("google")){
      return res.redirect("/auth/google")
    }

    if(req.body.hasOwnProperty("registro")){
      return res.redirect("/registro")
     }

    var email = req.body.email
    var senha = req.body.password

    if (email == ""  || senha == "") {
      req.status= "Por favor, preencha todos os campos!"
      return next();
    }

    //Confere se o email ja esta cadastrado 
    var usuario_existe = await Usuario.findOne({ email: req.body.email})

    if(usuario_existe){ 
      var salt = usuario_existe.salt;
      var hash = bcrypt.hashSync(senha, salt);

      if(hash != usuario_existe.senha){
        req.status="Senha incorreta"
        return next();
      }else{
        const secret = process.env.SECRET
        const token = jwt.sign({ id: usuario_existe._id }, secret, {
          expiresIn: 86400 // expires in 24 hours
        });
        res.cookie('auth', token);
      }
    }else{
      req.status="Email não registrado"
      return next();
    }
    res.redirect('/profile')
  }
  //GET, é chamado quando abrimos a rota /login, chama home_login
  app.get('/login',home_login)
  //POST, é chamado quando escrevemos dados em /login, chama registra e depois home_login
  app.post('/login',login,home_login)
//////////////////////////////////////////////////////////////////////////////////////
//PROFILE
//Manda a pessoa para a pagina de perfil
app.get("/profile",verifyAuthToken, async (req, res) => {
    res.send("Welcome");
    var usuario_existe = await Usuario.findOne({ "_id": req.userId})
  });
//////////////////////////////////////////////////////////////////////////////////////
//HOME
//Cria a pagina home
app.get('/', (req, res) => {
  res.render('pages/home.ejs');
})
//////////////////////////////////////////////////////////////////////////////////////
//Abre o servidor local na porta 8000
app.listen(8000)
//////////////////////////////////////////////////////////////////////////////////////
//COISAS RELACIONADAS COM O GOOGLE AUTH
//Abre a pagina de login/registro do google
app.get(
    "/auth/google",
    passaport_google.authenticate("google", { scope: ["email", "profile"] })
  );
//Pega as informações da conta
app.get(
    "/auth/google/callback",
    passaport_google.authenticate("google", { session: false }),
    (req, res) => {
      res.redirect("/profile");
    }
  );
//////////////////////////////////////////////////////////////////////////////////////
//COISAS RELACIONADAS COM O FACEBOOK AUTH
//Abre a pagina de login/registro do facebook
app.get(
    "/auth/facebook",
    passaport_facebook.authenticate("facebook", { scope: ["public_profile", "email"] }),
  );
  
//Pega as informações da conta
app.get(
    "/auth/facebook/callback",
    passaport_facebook.authenticate("facebook", { session: false }),
    (req, res) => {
      res.redirect("/profile");
    }
  );
//////////////////////////////////////////////////////////////////////////////////////
//TUDO RELACIONADO AO CHATGPT
//ABAIXO TEMOS O GET, QUE SÓ RENDERIZA A PAGINA DO CHAT, NA ROTA ASSISTENTE
app.get("/assistente", async (req, res) => {
    res.render("pages/chatgpt.ejs")
});

//POST
app.post("/assistente", async (req, res) => {
  var userMessage = req.body.message; //Pega oque o usuario digitou do html

  userMessage = "Com base na legislação brasileira," + userMessage
  const messages = [ //Formata a pergunta do usuario
    { role: "user", content: userMessage },
  ];

  const options = {
    temperature: 0.8, //Define a aleatorieda
    max_tokens: 2000, //Define o tamanho maximo da resposta, 1 token = 4 caracteres 
  };

  const choices = await createChatCompletion(messages, options); //Chama a função que conecta com o chat

  res.json({ message: choices[0].message.content }); //Manda a respota do chat para o html
 });
//////////////////////////////////////////////////////////////////////////////////////    
//Conecta com o banco de dados
  async function connect(){
    try{
        await mongoose.connect(url)
        console.log("Connect to Mongo DB")
    }catch(error){
        console.error(error)
    }
}
connect();