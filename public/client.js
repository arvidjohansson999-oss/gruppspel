<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Arvids Amongus</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #222;
            color: #eee;
            text-align: center;
            padding: 20px;
        }
        #traitorBox, #executionerBox {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(255, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 2rem;
            text-align: center;
            z-index: 9999;
            display: none;
            pointer-events: none;
        }
        #playerList {
            margin-top: 20px;
            text-align: left;
            max-width: 300px;
            margin-left: auto;
            margin-right: auto;
        }
        #traitorSliderContainer {
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <h1>AAE - Arvids Amongus Experience</h1>

    <div id="joinMenu">
        <input type="text" id="nameInput" placeholder="Skriv ditt namn" />
        <input type="text" id="roomInput" placeholder="Rumskod" />
        <button id="joinBtn">Gå med i spel</button>
    </div>

    <div id="playerList" style="display:none"></div>
    <button id="startBtn" style="display:none">Starta spelet</button>

    <div id="traitorSliderContainer" style="display:none;">
        <label for="traitorSlider">Antal förädare:</label>
        <input type="range" id="traitorSlider" min="1" max="3" value="2" />
        <span id="traitorCount">2</span>
    </div>

    <div id="traitorBox">
        <h2>Förädare</h2>
        <p>Dina medspelare:</p>
        <ul id="traitorList"></ul>
    </div>

    <!-- Executioner box skapas dynamiskt i client.js -->

    <script src="/socket.io/socket.io.js"></script>
    <script src="client.js"></script>
</body>
</html>
