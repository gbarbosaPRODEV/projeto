function fecharInstrucoes() {
  document.getElementById("como-jogar").style.display = "none";
  document.getElementById("class-selection").style.display = "block";
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const fundos = {};
for (let i = 1; i <= 12; i++) {
  const img = new Image();
  img.src = `imagens/fase${i}.png`;
  fundos[i] = img;
}

let player, enemies = [], projectiles = [], effects = [];
let keys = {}, gameStarted = false;
let faseAtual = 1, inimigosDerrotados = 0, portaAberta = false;
let mouseX = 0, mouseY = 0;

const imagens = {
  mago: "imagens/mago.png",
  assassino: "imagens/assassino.png",
  marionete_esquecida: "imagens/marionete_esquecida.png",
  eco_de_cordas: "imagens/eco_de_cordas.png",
  o_palhaco_do_vazio: "imagens/o_palhaco_do_vazio.png",
  a_cega: "imagens/a_cega.png",
  aquela_que_sussurra: "imagens/aquela_que_sussurra.png",
  o_observador_velado: "imagens/o_observador_velado.png",
  arauto_estelar: "imagens/arauto_estelar.png",
  guardiao_galactico: "imagens/guardiao_galactico.png",
  entidade_das_mil_luas: "imagens/entidade_das_mil_luas.png",
  demoniaco: "imagens/demoniaco.png",
  cao_demoníaco: "imagens/cao_demoníaco.png",
  senhor_do_abismo: "imagens/senhor_do_abismo.png"
};

function startGame(classe) {
  document.getElementById("class-selection").style.display = "none";
  canvas.style.display = "block";

  player = {
    x: 100, y: 300,
    width: 40, height: 40,
    classe,
    img: new Image(),
    vida: 150, maxVida: 150,
    velocidade: 3,
    habilidade: classe === "mago" ? "bolaDeFogo" : "invisibilidade",
    invisible: false,
    atkCooldown: 0,
    skillCooldown: 0
  };
  player.img.src = imagens[classe];
  gerarInimigos(faseAtual);
  gameLoop();
}

function gerarInimigos(fase) {
  enemies = [];
  inimigosDerrotados = 0;
  portaAberta = false;

console.log("Gerando inimigos da fase", fase);
console.log("Fase", fase, "inimigos gerados:", enemies.length);

  const bosses = {
    3: { nome: "o_palhaco_do_vazio", vida: 250, dano: 12, width: 80, height: 80 },
    6: { nome: "o_observador_velado", vida: 350, dano: 15, width: 90, height: 90 },
    9: { nome: "entidade_das_mil_luas", vida: 450, dano: 18, width: 100, height: 100 },
    12: { nome: "senhor_do_abismo", vida: 600, dano: 22, width: 120, height: 120 }
  };

  if (bosses[fase]) {
    const b = bosses[fase];
    const img = new Image();
    img.src = imagens[b.nome];
    enemies.push({
      tipo: "boss",
      x: 600, y: 200,
      width: b.width,
      height: b.height,
      vida: b.vida,
      maxVida: b.vida,
      img,
      dano: b.dano,
      atkCooldown: 0
    });
    return;
  }

  const tipos = [
    { nome: "marionete_esquecida", vida: 60, dano: 5, ataqueEspecial: "pulo" },
    { nome: "eco_de_cordas", vida: 70, dano: 6, ataqueEspecial: "projetil" },
    { nome: "a_cega", vida: 80, dano: 7, ataqueEspecial: "investida" },
    { nome: "aquela_que_sussurra", vida: 100, dano: 8, ataqueEspecial: "projetil_lento" },
    { nome: "arauto_estelar", vida: 110, dano: 8, ataqueEspecial: "zigzag" },
    { nome: "guardiao_galactico", vida: 120, dano: 10, ataqueEspecial: "investida" },
    { nome: "demoniaco", vida: 130, dano: 11, ataqueEspecial: "projetil_rapido" },
    { nome: "cao_demoníaco", vida: 150, dano: 12, ataqueEspecial: "pulo" }
  ];

// Lista de fases normais (excluindo bosses)
const fasesNormais = [1, 2, 4, 5, 7, 8, 10, 11];
const faseIndice = fasesNormais.indexOf(fase);

if (faseIndice === -1) return; // segurança: se a fase não estiver na lista, não faz nada

const tipo = tipos[faseIndice];


  for (let i = 0; i < 5; i++) {
    const img = new Image();
    img.src = imagens[tipo.nome];
    enemies.push({
      tipo: tipo.nome,
      x: 600 + Math.random() * 100,
      y: 100 + i * 80,
      width: 40,
      height: 40,
      vida: tipo.vida,
      maxVida: tipo.vida,
      dano: tipo.dano,
      ataqueEspecial: tipo.ataqueEspecial,
      img,
      atkCooldown: 0
    });
  }
}

function ataqueBasico() {
  if (player.classe === "assassino") {
    const alcance = 60;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    effects.push({ type: "golpeAssassino", x: px - 30, y: py - 5, duration: 8 });

    enemies.forEach(e => {
      const ex = e.x + e.width / 2;
      const ey = e.y + e.height / 2;
      const dist = Math.hypot(px - ex, py - ey);
      if (dist < alcance) {
        let dano = 10;
        if (player.invisible && player.x < e.x) dano *= 2.5;
        const vidaAntes = e.vida;
        e.vida = Math.max(0, e.vida - dano);
        if (vidaAntes > 0 && e.vida === 0) inimigosDerrotados++;
      }
    });
  } else {
    const dx = mouseX - (player.x + player.width / 2);
    const dy = mouseY - (player.y + player.height / 2);
    const dist = Math.hypot(dx, dy);
    const vx = (dx / dist) * 6;
    const vy = (dy / dist) * 6;

    projectiles.push({
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      vx, vy,
      width: 8,
      height: 8,
      color: "blue",
      dano: 10,
      inimigo: false
    });
  }
}

function usarHabilidade() {
  if (player.skillCooldown > 0) return;

  const dx = mouseX - (player.x + player.width / 2);
  const dy = mouseY - (player.y + player.height / 2);
  const dist = Math.hypot(dx, dy);
  const vx = (dx / dist) * 8;
  const vy = (dy / dist) * 8;

  if (player.habilidade === "bolaDeFogo") {
    player.skillCooldown = 200;
    projectiles.push({
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      vx, vy,
      width: 16, height: 16,
      color: "orange",
      dano: 70,
      inimigo: false
    });
  } else if (player.habilidade === "invisibilidade") {
    player.skillCooldown = 420;
    player.invisible = true;
    setTimeout(() => {
      player.invisible = false;
    }, 3000);
  }
}
function atualizarInimigos() {
  for (let enemy of enemies) {
    if (player.invisible && player.classe === "assassino") continue;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 40) {
      enemy.x += Math.sign(dx) * 0.8;
      enemy.y += Math.sign(dy) * 0.8;
    }

    if (enemy.atkCooldown > 0) {
      enemy.atkCooldown--;
      continue;
    }

    if (enemy.tipo === "boss") {
      if (dist < 60) {
        player.vida -= enemy.dano;
      } else {
        const escolha = Math.floor(Math.random() * 3);
        projectiles.push({
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height / 2,
          vx: dx / 20,
          vy: dy / 20,
          width: 12,
          height: 12,
          color: ["red", "black", "purple"][escolha],
          dano: 20 + escolha * 10,
          inimigo: true
        });
      }
      enemy.atkCooldown = 60;
      continue;
    }

    switch (enemy.ataqueEspecial) {
      case "projetil":
        projectiles.push({
          x: enemy.x + 20, y: enemy.y + 20,
          vx: dx / 25, vy: dy / 25,
          width: 6, height: 6,
          color: "yellow", dano: 6,
          inimigo: true
        });
        enemy.atkCooldown = 90;
        break;
      case "projetil_lento":
        projectiles.push({
          x: enemy.x + 20, y: enemy.y + 20,
          vx: dx / 40, vy: dy / 40,
          width: 10, height: 10,
          color: "purple", dano: 5,
          inimigo: true
        });
        enemy.atkCooldown = 100;
        break;
      case "projetil_rapido":
        projectiles.push({
          x: enemy.x + 20, y: enemy.y + 20,
          vx: dx / 15, vy: dy / 15,
          width: 5, height: 5,
          color: "red", dano: 8,
          inimigo: true
        });
        enemy.atkCooldown = 70;
        break;
      case "pulo":
        enemy.x += Math.sign(dx) * 10;
        enemy.y += Math.sign(dy) * 10;
        if (dist < 50) player.vida -= enemy.dano;
        enemy.atkCooldown = 80;
        break;
      case "investida":
        if (dist < 60) player.vida -= enemy.dano * 1.5;
        enemy.x += Math.sign(dx) * 5;
        enemy.y += Math.sign(dy) * 5;
        enemy.atkCooldown = 100;
        break;
      case "zigzag":
        enemy.x += Math.cos(Date.now() / 100) * 2;
        enemy.y += Math.sign(dy);
        if (dist < 50) player.vida -= enemy.dano;
        enemy.atkCooldown = 90;
        break;
      default:
        if (dist < 40) {
          player.vida -= enemy.dano;
          enemy.atkCooldown = 50;
        }
    }
  }
}

function drawProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx;
    p.y += p.vy;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);

    if (p.inimigo) {
      if (
        p.x < player.x + player.width &&
        p.x + p.width > player.x &&
        p.y < player.y + player.height &&
        p.y + p.height > player.y
      ) {
        player.vida -= p.dano;
        projectiles.splice(i, 1);
      }
    } else {
      for (let e of enemies) {
        if (
          p.x < e.x + e.width &&
          p.x + p.width > e.x &&
          p.y < e.y + e.height &&
          p.y + p.height > e.y
        ) {
          const vidaAntes = e.vida;
          e.vida = Math.max(0, e.vida - p.dano);
          if (vidaAntes > 0 && e.vida === 0) inimigosDerrotados++;
          projectiles.splice(i, 1);
          break;
        }
      }
    }
  }
}

function drawBar(x, y, value, max, color) {
  ctx.fillStyle = "gray";
  ctx.fillRect(x, y, 40, 5);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 40 * Math.max(0, value / max), 5);
}

function drawPlayer() {
  ctx.globalAlpha = player.invisible ? 0.3 : 1;
  ctx.drawImage(player.img, player.x, player.y, player.width, player.height);
  drawBar(player.x, player.y - 10, player.vida, player.maxVida, "green");
  ctx.globalAlpha = 1;
}

function drawEnemies() {
  enemies.forEach(e => {
    ctx.drawImage(e.img, e.x, e.y, e.width, e.height);
    drawBar(e.x, e.y - 10, e.vida, e.maxVida, "red");
  });
}

function drawEffects() {
  for (let i = effects.length - 1; i >= 0; i--) {
    const eff = effects[i];
    if (eff.type === "golpeAssassino") {
      ctx.fillStyle = "darkblue";
      ctx.globalAlpha = 0.5;
      ctx.fillRect(eff.x, eff.y, 60, 10);
      ctx.globalAlpha = 1;
    }
    eff.duration--;
    if (eff.duration <= 0) effects.splice(i, 1);
  }
}

function drawPorta() {
  if (!portaAberta) return;
  ctx.fillStyle = "yellow";
  ctx.fillRect(750, 250, 40, 100);
  if (
    player.x + player.width > 750 &&
    player.y + player.height > 250 &&
    player.y < 350
  ) {
    faseAtual++;

    // 🔧 Cura ao passar de fase
    const cura = 50;
    player.vida = Math.min(player.vida + cura, player.maxVida);

    if (faseAtual > 12) {
      document.getElementById("tela-vitoria").style.display = "flex";
      return;
    } else {
      gerarInimigos(faseAtual);
      player.x = 100;
      player.y = 300;
    }
  }
}

function moverPlayer() {
  if (keys["w"] && player.y > 0) player.y -= player.velocidade;
  if (keys["s"] && player.y + player.height < canvas.height) player.y += player.velocidade;
  if (keys["a"] && player.x > 0) player.x -= player.velocidade;
  if (keys["d"] && player.x + player.width < canvas.width) player.x += player.velocidade;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Desenha o fundo da fase atual
  ctx.drawImage(fundos[faseAtual], 0, 0, canvas.width, canvas.height);
  moverPlayer();
  atualizarInimigos();
  drawPlayer();
  drawEnemies();
  drawProjectiles();
  drawEffects();
  drawPorta();
  enemies = enemies.filter(e => e.vida > 0);
  if (player.atkCooldown > 0) player.atkCooldown--;
  if (player.skillCooldown > 0) player.skillCooldown--;
  if (!portaAberta && enemies.length === 0) {
    if ([3, 6, 9, 12].includes(faseAtual) || inimigosDerrotados >= 5) {
      portaAberta = true;
    }
  }
  if (player.vida <= 0) {
    alert("Você morreu!");
    location.reload();
    return;
  }
  requestAnimationFrame(gameLoop);
}
// Controles
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

canvas.addEventListener("mousedown", e => {
  if (e.button === 0 && player.atkCooldown <= 0) {
    ataqueBasico();
    player.atkCooldown = 20;
  }
  if (e.button === 2 && player.skillCooldown <= 0) {
    usarHabilidade();
  }
});

canvas.addEventListener("contextmenu", e => e.preventDefault());
