let currentIndex = 0;
let totalPreguntas = 0;
let score = 0;
let tiempoRestante = 20;
let timerInterval;
let preguntas = [];
let nombreJugador = "Invitado";
let correctCount = 0;
let wrongCount = 0;
let tiempoInicio = 0;

// 🔄 Petición a la API
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
    loadingDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    console.error(error);
    return null;
  }
}

// 🚀 Iniciar juego
function iniciarPartida(listaPreguntas) {
  preguntas = listaPreguntas;
  totalPreguntas = preguntas.length;
  currentIndex = 0;
  score = 0;
  correctCount = 0;
  wrongCount = 0;
  tiempoInicio = Date.now();

  document.getElementById('liveScore').textContent = 0;
  document.getElementById('correctCount').textContent = 0;
  document.getElementById('wrongCount').textContent = 0;

  document.getElementById('loading').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  mostrarPregunta();
}

function mostrarPregunta() {
  if (timerInterval) clearInterval(timerInterval);

  const pregunta = preguntas[currentIndex];
  const preguntaTexto = document.getElementById('questionText');
  const answersDiv = document.getElementById('answers');
  const progress = document.getElementById('progress');
  const timeElem = document.getElementById('timeLeft');
  const timerDiv = document.getElementById('timer');

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

  tiempoRestante = 20;
  timeElem.textContent = tiempoRestante;
  timerDiv.classList.remove("urgente");

  timerInterval = setInterval(() => {
    tiempoRestante--;
    timeElem.textContent = tiempoRestante;

    if (tiempoRestante <= 5) {
      timerDiv.classList.add("urgente");
    } else {
      timerDiv.classList.remove("urgente");
    }

    if (tiempoRestante <= 0) {
      clearInterval(timerInterval);
      marcarRespuestaCorrecta();
      bloquearRespuestas();
      wrongCount++;
      actualizarMarcadores();
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
    correctCount++;
  } else {
    btn.classList.add('incorrecta');
    marcarRespuestaCorrecta();
    wrongCount++;
  }

  document.getElementById('timer').classList.remove("urgente");
  document.getElementById('nextBtn').disabled = false;
  actualizarMarcadores();
}

function actualizarMarcadores() {
  document.getElementById('liveScore').textContent = score;
  document.getElementById('correctCount').textContent = correctCount;
  document.getElementById('wrongCount').textContent = wrongCount;
}

function marcarRespuestaCorrecta() {
  document.querySelectorAll('.answer-btn').forEach(b => {
    if (b.innerHTML === decodeHTMLEntities(preguntas[currentIndex].correct_answer)) {
      b.classList.add('correcta');
    }
  });
  document.getElementById('timer').classList.remove("urgente");
}

function bloquearRespuestas() {
  document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
}

document.getElementById('nextBtn').addEventListener('click', async () => {
  currentIndex++;
  if (currentIndex < preguntas.length) {
    mostrarPregunta();
  } else {
    const duracion = (Date.now() - tiempoInicio) / 1000;
    const tiempoPromedio = (duracion / totalPreguntas).toFixed(2);
    const porcentaje = Math.round((correctCount / totalPreguntas) * 100);

    document.getElementById('game').innerHTML = `
      <h2>🎉 ¡Juego finalizado, ${nombreJugador}!</h2>
      <p>Respondiste correctamente ${correctCount} de ${totalPreguntas} preguntas.</p>
      <p>Puntos totales: ${score}</p>
      <p>Porcentaje de acierto: ${porcentaje}%</p>
      <p>⏱️ Tiempo promedio por pregunta: ${tiempoPromedio} segundos</p>

      <div style="margin-top:20px;">
        <button id="repetirBtn">🔁 Jugar de nuevo (misma config)</button>
        <button id="reiniciarBtn">⚙️ Nueva configuración</button>
        <button id="salirBtn">❌ Finalizar</button>
      </div>
    `;

    document.getElementById("repetirBtn").addEventListener("click", async () => {
      const apiUrl = construirApiUrl(totalPreguntas, document.getElementById("category").value, document.getElementById("difficulty").value);
      const nuevasPreguntas = await obtenerPreguntas(apiUrl);
      if (nuevasPreguntas) iniciarPartida(nuevasPreguntas);
    });

    document.getElementById("reiniciarBtn").addEventListener("click", () => {
      location.reload();
    });

    document.getElementById("salirBtn").addEventListener("click", () => {
      document.getElementById("app").innerHTML = `
        <h2>¡Gracias por jugar, ${nombreJugador}!</h2>
        <p>🎮 Esperamos verte pronto otra vez.</p>
      `;
    });
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

// 🎮 Iniciar juego con botón único
document.getElementById("startBtn").addEventListener("click", async () => {
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

  document.getElementById("intro").style.display = "none";
  document.getElementById("loading").style.display = "block";

  const preguntas = await obtenerPreguntas(apiUrl);
  if (preguntas) {
    iniciarPartida(preguntas);
  }
});
