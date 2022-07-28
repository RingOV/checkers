//Функция создания объекта ячейки
function Cell(color, who, koord, x, y, changed, can_move) {
    this.color = color;  // [b, w]
    this.who = who;      // [bc, wc, bq, wq, ##]
    this.koord = koord;  // [a8, b8, c8, ...]
    this.x = x;
    this.y = y;
    this.changed = changed;
    this.can_move = can_move;
}

//Вывод массива (всех ячеек доски)
function printArr(arr){
    for (let i=0; i < arr.length; i++) {
        s = ''
        for (let j=0; j < arr[i].length; j++){
            s += arr[i][j].who+' '
        }
        s += 8-i;
        console.log(s);
    }
    console.log('===========================')
}

// Глобальные переменные
var canvas;
var ctx;

var bcSVG;
var wcSVG;
var boardSVG;

var images;

var who_move = [["wc", "wq"], ["bc", "bq"]];
var count_move = 0;

//координаты выбранной шашки
var changed = {
    "x": -1,
    "y": -1,
}

//Создание пустого массива доски
var board = [];

//Функция инициализации
function init(){
    //Присваивание значений глобальным переменным
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext('2d');
    bcSVG = document.getElementById("bc");
    wcSVG = document.getElementById("wc");
    boardSVG = document.getElementById("board");
    images = {
        "bc": bcSVG,
        "wc": wcSVG,
    }

    //Заполнение массива доски "ячейками"
    charArr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    for (let i=0; i<8; i++){
        var arr = [];
        for (let j=0; j<8; j++){
            // Заполнение доски белыми и чёрными клетками 
            c = '##';
            if (i % 2 == j % 2){c = '  ';}
            // Заполнение доски объектами ячеек
            arr.push(new Cell('b', c, charArr[j]+(8-i), 60+j*110, 60+i*110, false, false));
        }
        board.push(arr);
    }
    //Добавляем сигнал "нажатие кнопки мыши"
    canvas.addEventListener('mousedown', function(e) {
        getCursorPosition(canvas, e)
    })
    fillBoardDefault();
    draw();
}

//Обработка события "нажатие кнопки мыши"
function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left - 60*factor)/110/factor);
    const y = Math.floor((event.clientY - rect.top - 60*factor)/110/factor);
    if (x < 0 || x > 7 || y < 0 || y > 7){return;}
    console.log("selected "+"x: " + x + " y: " + y);
    //Если выделена шашка
    if (who_move[count_move%2].includes(board[y][x].who)){
        clearAllChanged();
        board[y][x].changed = true;
        changed.x = x;
        changed.y = y;
        //клетки, куда можно походить
        if (x > 0 & Math.abs(y-(-1)**(count_move%2)-3.5)<3.6){
            if (board[y-(-1)**(count_move%2)][x-1].who == "##") {
                board[y-(-1)**(count_move%2)][x-1].can_move = true;
                // console.log(board[y-1][x-1].koord);
            }
        }
        if (x < 7 & Math.abs(y-(-1)**(count_move%2)-3.5)<3.6){
            if (board[y-(-1)**(count_move%2)][x+1].who == "##") {
                board[y-(-1)**(count_move%2)][x+1].can_move = true;
                // console.log(board[y-1][x+1].koord);
            }
        }
        //клетки, в которые можно побить
        can_get = []
        for (a = -1; a < 2; a += 2) {
            for (b = -1; b < 2; b += 2) {
                try {
                    if (who_move[(count_move+1)%2].includes(board[y+a][x+b].who)) {
                        if (board[y+a*2][x+b*2].who == "##"){
                            can_get.push([y+a*2, x+b*2, y+a, x+b]);
                        }
                    }
                } catch (e) {}
            }
        }
        if (can_get.length != 0) {
            for (i = 0; i < can_get.length; i++) {
                board[can_get[i][0]][can_get[i][1]].can_move = true
                console.log("can_get: "+board[can_get[i][0]][can_get[i][1]].koord)
            }
        }

        draw();
    }
    //Если выделено, куда можно походить
    if (board[y][x].can_move){
        clearAllChanged();
        t = board[changed.y][changed.x].who;
        board[changed.y][changed.x].who = "##";
        board[y][x].who = t;
        count_move++;
        draw();
    }
}

function clearAllChanged() {
    for (let i=0; i<8; i++){
        for (let j=0; j<8; j++){
            board[i][j].changed = false;
            board[i][j].can_move = false;
        }
    }
}


//Заполнить доску шашками как при стандартной игре
function fillBoardDefault() {
    for (let i=0; i<8; i++){
        for (let j=0; j<8; j++){
            if (board[i][j].who == '##'){
                if (i < 3 ){board[i][j].who = 'bc';}
                if (i > 4){board[i][j].who = 'wc';}
            }
        }
    }

}

var factor;

function draw(){
    canvas.width  = window.innerWidth-30;
    canvas.height = window.innerHeight-30;

    // set scale factor
    factor = canvas.height/1000
    if (canvas.width/1000 < factor) {
        factor = canvas.width/1000
    }
    ctx.scale(factor, factor)

    //Тестовый вывод массива
    printArr(board);

    //Рисуем доску
    ctx.drawImage(boardSVG, 0, 0, 1000, 1000);
    //Рисуем шашки
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            //шашки
            if (['wc', 'wq', 'bc', 'bq'].includes(board[i][j].who)) {
                ctx.drawImage(images[board[i][j].who], board[i][j].x, board[i][j].y, 110, 110);
                //выделенная шашка
                if (board[i][j].changed) {
                    ctx.beginPath();
                    ctx.lineWidth = "6";
                    ctx.strokeStyle = "red";
                    ctx.rect(board[i][j].x, board[i][j].y, 110, 110);
                    ctx.stroke();
                }
            //выделленые клетки куда можно ходить
            }
            if (board[i][j].can_move) {
                ctx.beginPath();
                ctx.rect(board[i][j].x, board[i][j].y, 110, 110);
                ctx.closePath();
                ctx.fillStyle = "#0087ff";
                ctx.fill();
            }
        }
    }
}