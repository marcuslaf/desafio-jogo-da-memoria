# Jogo da Memória | Memory Game

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## Sobre | About

Jogo da memória desenvolvido com HTML, CSS e JavaScript puros. O objetivo é encontrar os pares correspondentes de cartas no menor tempo possível e com o menor número de jogadas.

A memory game built with vanilla HTML, CSS, and JavaScript. The goal is to find matching card pairs in the shortest time with the fewest moves.

---

## Funcionalidades | Features

- **3 níveis de dificuldade** — 4×4, 4×3 e 5×4
- **Contador de jogadas e tempo** — acompanhe seu desempenho
- **Barra de progresso** — visualização do progresso em tempo real
- **Sistema de estrelas** — avaliação baseada no número de jogadas
- **Records pessoais** — salvos no localStorage por dificuldade
- **Compartilhar resultado** — via Web Share API ou clipboard
- **Efeitos sonoros** — flip, match, mismatch e vitória (Web Audio API)
- **Animações** — flip 3D, tilt no hover, confetti, shake, pulse
- **Acessibilidade** — navegação por teclado, ARIA labels, focus-visible
- **Responsivo** — funciona em desktop, tablet e mobile
- **Tema ocean/teal** — paleta de cores suave e moderna

---

## Como Jogar | How to Play

1. Clique em duas cartas para revelá-las
2. Se forem iguais, permanecem viradas (borda dourada)
3. Se forem diferentes, voltam a ficar ocultas
4. O objetivo é encontrar todos os pares
5. Use o seletor para mudar a dificuldade
6. Clique em "Reiniciar Jogo" para recomeçar

---

## Estrutura do Projeto | Project Structure

```
├── index.html              # Arquivo principal HTML
├── README.md               # Documentação
└── src/
    ├── styles/
    │   ├── reset.css       # Reset e acessibilidade
    │   └── main.css        # Design system completo
    └── scripts/
        └── engine.js       # Lógica do jogo
```

---

## Tecnologias | Technologies

- **HTML5** — semântica, acessibilidade, meta tags
- **CSS3** — custom properties, grid, 3D transforms, animations
- **JavaScript ES6+** — IIFE, Fisher-Yates, Web Audio API, localStorage

---

## Como Executar | How to Run

```bash
git clone https://github.com/Marcuslaf/jogo-da-memoria.git
cd jogo-da-memoria
# Abra index.html no navegador
```

---

## Deploy

Este projeto está hospedado na [Vercel](https://vercel.com).

---

## License

MIT
