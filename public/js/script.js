
const phoneInput = document.getElementById("phone");
const botão = document.getElementById("botao")

phoneInput.addEventListener("input", function () {
  const phoneNumber = phoneInput.value.replace(/\D/g, "");
  const phoneNumberLength = phoneNumber.length;

  if (phoneNumberLength <= 2) {
    phoneInput.value = phoneNumber;
  }

  if (phoneNumberLength > 2 && phoneNumberLength <= 7) {
    phoneInput.value = `${phoneNumber.slice(0, 2)} ${phoneNumber.slice(2)}`;
  }

  if (phoneNumberLength > 7 && phoneNumberLength <= 11) {
    phoneInput.value = `${phoneNumber.slice(0, 2)} ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(
      7
    )}`;
  }

  if (phoneNumberLength > 11) {
    phoneInput.value = `${phoneNumber.slice(0, 2)} ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(
      7,
      11
    )}`;
  }
});

/*
botão.addEventListener("click", function (){
  var name = document.getElementById("name").value
  var email = document.getElementById("email").value
  var senha = document.getElementById("password").value
  var confirma_senha = document.getElementById("confirmpassword").value

  if (name == "" || email == "" || celular == "" || senha == "" || confirma_senha == "") {
    alert("Por favor, preencha todos os campos!")
    return("false")
  }

  if (name.length < 2) {
    alert("Nome invalido!")
    return("false")
  }
  if (email.length < 5) {
    alert("Email invalido!")
    return("false")
  }
  if (senha.length < 8) {
    alert("A senha deve conter no minimo 8 caracteres")
    return("false")
  }
  if (senha != confirma_senha) {
    alert("As senhas devem ser iguais")
    return("false")
  }
})
*/
