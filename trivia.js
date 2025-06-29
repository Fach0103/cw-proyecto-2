let currentIndex = 0;
let totalPreguntas = 0;
let score = 0;
let tiempoRestante = 10;
let timerInterval;
let preguntas = [];
let nombreJugador = "Invitado"; // Valor por defecto

// 🔄 Petición asíncrona a la API
async function obtenerPreguntas(apiUrl) {
  const loadingDiv = document.getElementById('loading');
  loadingDiv.style.display = 'block';
  loadingDiv.innerHTML = `<p>Cargando preguntas...</p>`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    const data = await response.json();
    loadingDiv.style.display = 'none';

    if (!data.results || data.results.length === 0) {
      throw new Error("No se encontraron preguntas.");
    }

    return data.results;
  } catch (error) {
    loadingDiv.innerHTML = `<p>Error al obtener preguntas: ${error.message}</p>`;
    console.error(error);
    return null;
  }
}

// 🚀 Juego
function iniciarPartida(listaPreguntas) {
  preguntas = listaPreguntas;
  totalPreguntas = preguntas.length;
  currentIndex = 0;
  score = 0;

  document.getElementById('game').style.display = 'block';
  mostrarPregunta();
}

function mostrarPregunta() {
  if (timerInterval) clearInterval(timerInterval);

  const pregunta = preguntas[currentIndex];
  const preguntaTexto = document.getElementById('questionText');
  const answersDiv = document.getElementById('answers');
  const progress = document.getElementById('progress');
  const timeElem = document.getElementById('timeLeft');

  progress.textContent = `Pregunta ${currentIndex + 1} de ${totalPreguntas}`;
  preguntaTexto.innerHTML = decodeHTMLEntities(pregunta.question);

  const opciones = [...pregunta.incorrect_answers];
  const posicionCorrecta = Math.floor(Math.random() * 4);
  opciones.splice(posicionCorrecta, 0, pregunta.correct_answer);

  answersDiv.innerHTML = '';
  opciones.forEach(opcion => {
    const btn = document.createElement('button');
    btn.innerHTML = decodeHTMLEntities(opcion);
    btn.classList.add('answer-btn');
    btn.onclick = () => validarRespuesta(btn, opcion === pregunta.correct_answer);
    answersDiv.appendChild(btn);
  });

  tiempoRestante = 10;
  timeElem.textContent = tiempoRestante;
  timerInterval = setInterval(() => {
    tiempoRestante--;
    timeElem.textContent = tiempoRestante;
    if (tiempoRestante <= 0) {
      clearInterval(timerInterval);
      marcarRespuestaCorrecta();
      bloquearRespuestas();
      document.getElementById('nextBtn').disabled = false;
    }
  }, 1000);

  document.getElementById('nextBtn').disabled = true;
}

function validarRespuesta(btn, correcta) {
  clearInterval(timerInterval);
  bloquearRespuestas();

  if (correcta) {
    btn.classList.add('correcta');
    score += 10;
  } else {
    btn.classList.add('incorrecta');
    marcarRespuestaCorrecta();
  }

  document.getElementById('nextBtn').disabled = false;
}

function marcarRespuestaCorrecta() {
  document.querySelectorAll('.answer-btn').forEach(b => {
    if (b.innerHTML === decodeHTMLEntities(preguntas[currentIndex].correct_answer)) {
      b.classList.add('correcta');
    }
  });
}

function bloquearRespuestas() {
  document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
}

document.getElementById('nextBtn').addEventListener('click', () => {
  currentIndex++;
  if (currentIndex < preguntas.length) {
    mostrarPregunta();
  } else {
    document.getElementById('game').innerHTML = `
      <h2>¡Juego finalizado, ${nombreJugador}!</h2>
      <p>Puntuación final: ${score}</p>`;
  }
});

function decodeHTMLEntities(text) {
  const txt = document.createElement('textarea');
  txt.innerHTML = text;
  return txt.value;
}

function construirApiUrl(cantidad, categoria, dificultad) {
  return `https://opentdb.com/api.php?amount=${cantidad}` +
         (categoria !== "any" ? `&category=${categoria}` : "") +
         `&difficulty=${dificultad}&type=multiple`;
}

document.getElementById("startGame").addEventListener("click", async () => {
  const nombre = document.getElementById("playerName").value.trim();
  const cantidad = parseInt(document.getElementById("numQuestions").value);
  const dificultad = document.getElementById("difficulty").value;
  const categoria = document.getElementById("category").value;

  if (nombre.length < 2 || nombre.length > 20) {
    alert("El nombre debe tener entre 2 y 20 caracteres.");
    return;
  }

  if (isNaN(cantidad) || cantidad < 5 || cantidad > 20) {
    alert("El número de preguntas debe estar entre 5 y 20.");
    return;
  }

  nombreJugador = nombre;
  const apiUrl = construirApiUrl(cantidad, categoria, dificultad);

  document.getElementById("setup").style.display = "none";

  const preguntas = await obtenerPreguntas(apiUrl);
  if (preguntas) {
    iniciarPartida(preguntas);
  }
});