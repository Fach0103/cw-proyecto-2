document.getElementById('startGame').addEventListener('click', () => {
  const name = document.getElementById('playerName').value.trim();
  const num = parseInt(document.getElementById('numQuestions').value);
  const diff = document.getElementById('difficulty').value;
  const cat = document.getElementById('category').value;

  if (name.length < 2 || name.length > 20) {
    alert("El nombre debe tener entre 2 y 20 caracteres.");
    return;
  }

  if (isNaN(num) || num < 5 || num > 20) {
    alert("La cantidad de preguntas debe estar entre 5 y 20.");
    return;
  }

  const apiUrl = `https://opentdb.com/api.php?amount=${num}` +
    (cat !== "any" ? `&category=${cat}` : "") +
    `&difficulty=${diff}&type=multiple`;

  // Ocultar configuración y pasar al juego
  document.getElementById('setup').style.display = 'none';
  iniciarJuego(apiUrl, name);
});

async function obtenerPreguntas(apiUrl) {
  const loadingDiv = document.getElementById('loading');
  loadingDiv.style.display = 'block'; 

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      throw new Error("No se encontraron preguntas.");
    }

    loadingDiv.style.display = 'none'; // Ocultar carga
    return data.results;

  } catch (error) {
    loadingDiv.innerHTML = `<p>Error al cargar preguntas: ${error.message}</p>`;
    console.error("Error al obtener preguntas:", error);
    return null; 
  }
}