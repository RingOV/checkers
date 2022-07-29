//Функция создания объекта ячейки
function Cell(color, who, koord, x, y, can_select, selected, can_move, can_jump, eat_after_jump, can_move_after_get, was_geted, get) {
    this.color = color;  // [b, w]
    this.who = who;      // [bc, wc, bq, wq, ##]
    this.koord = koord;  // [a8, b8, c8, ...]
    this.x = x;
    this.y = y;
    this.can_select = can_select; // true, false можно выбрать клетку с шашкой
    this.selected = selected; // true, false выбранная клетка с шашкой
    this.can_move = can_move; // true, false пустая клетка, в которую можно походить
    this.can_jump = can_jump; // true, false пустая клетка, в которую можно прыгнуть после взятия
    this.eat_after_jump = eat_after_jump; // [x, y]
    this.was_geted = was_geted; // true, false была съедена

    this.can_move_after_get = can_move_after_get; // true, false
    this.get = get; // [x, y]
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
var start_getting = false;

//координаты выбранной шашки
var selected = {
    "x": 0,
    "y": 0,
}

var must_get = false;

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
            arr.push(new Cell('b', c, charArr[j]+(8-i), 60+j*110, 60+i*110, false, false, false, false, [], false, false, []));
        }
        board.push(arr);
    }
    //Добавляем сигнал "нажатие кнопки мыши"
    canvas.addEventListener('mousedown', function(e) {
        getCursorPosition(canvas, e)
    })
    fillBoardDefault();
    mustMove();
    draw();
}

//Обработка события "нажатие кнопки мыши"
function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left - 60*factor)/110/factor);
    const y = Math.floor((event.clientY - rect.top - 60*factor)/110/factor);
    if (x < 0 || x > 7 || y < 0 || y > 7){return;}
    console.log("selected "+"x: " + x + " y: " + y);

    if (board[y][x].can_select) {
        board[selected.y][selected.x].selected = false;
        board[y][x].selected = true;
        selected.x = x;
        selected.y = y;
        setCanMoveOrJump(x, y);
        draw();
    }
    if (board[y][x].can_move) {
        move_to(x, y);
    }
    if (board[y][x].can_jump) {
        jump_to(x, y);
    }
}

//Функция выделения ячеек в которые можно ходить или прыгать
function setCanMoveOrJump(x, y) {
    if (must_get) {
        setCanJump(x, y);
    } else {
        setCanMove(x, y);
    }
}

//Функция взятия чужой шашки с прыжком в заданные координаты
function jump_to(x, y) {
    l = board[y][x].eat_after_jump;
    board[l[0]][l[1]].was_geted = true;
    board[y][x].who = board[selected.y][selected.x].who;
    board[selected.y][selected.x].who = "##";
    board[selected.y][selected.x].selected = false;
    clearCanMove();
    clearCanSelect();
    if (!checkGetKoord(x, y, true)){
        clearWasGeted();
        must_get = false;
        count_move++;
        mustMove();
    } else {
        must_get = true;
        board[y][x].selected = true;
        selected.x = x;
        selected.y = y;
        setCanJump(x, y);
    }
    draw();
    
}

//Функция перемещения шашки в заданные координаты
function move_to(x, y) {
    board[y][x].who = board[selected.y][selected.x].who;
    board[selected.y][selected.x].who = "##";
    board[selected.y][selected.x].selected = false;
    clearCanMove();
    clearCanSelect();
    count_move++;
    mustMove();
    draw();
}

//Отмечает шашки, которые могут/должны ходить/бить
function mustMove() {
    l = []; // список отмеченных шашек (елси только одна, то автоматически выделяем)
    list_can_get = checkGet();
    console.log("list_can_get "+list_can_get)
    if (list_can_get.length != 0) {
        must_get = true;
        for (i=0; i<list_can_get.length; i++) {
            board[list_can_get[i][0]][list_can_get[i][1]].can_select = true;
            l.push([list_can_get[i][0], list_can_get[i][1]]);
        }
    } else {
        list_can_move = checkMove();
        console.log("list_can_move "+list_can_move)
        if (list_can_move.length != 0) {
            must_get = false;
            for (i=0; i<list_can_move.length; i++) {
                board[list_can_move[i][0]][list_can_move[i][1]].can_select = true;
                l.push([list_can_move[i][0], list_can_move[i][1]]);
            }
        }
    }
    if (l.length == 1) {
        board[l[0][0]][l[0][1]].selected = true;
        selected.x = l[0][1];
        selected.y = l[0][0];
        setCanMoveOrJump(l[0][1], l[0][0]);
    }
}

//Возвращает список координат шашек, которые могут ходить
function checkMove() {
    list_can_move = []
    for (let i=0; i<8; i++){
        for (let j=0; j<8; j++){
            if (who_move[count_move%2].includes(board[i][j].who)) {
                can_move = false;
                try {
                    if (board[i-(-1)**(count_move%2)][j-1].who == "##") {
                        can_move = true;
                    }
                } catch (e) {}

                try {
                    if (board[i-(-1)**(count_move%2)][j+1].who == "##") {
                        can_move = true;
                    }
                } catch (e) {}

                if (can_move) {
                    list_can_move.push([i,j]);
                }
            }

        }
    }
    return list_can_move;
}

//Подсвечивает клетку, куда можно побить
function setCanJump(x, y) {
    clearCanMove();
    l = checkGetKoord(x, y);
    console.log(l);
    for (i=0; i<l.length; i++) {
        board[l[i][0]][l[i][1]].can_jump = true;
        board[l[i][0]][l[i][1]].eat_after_jump = [l[i][2], l[i][3]];
    }
}

//Подсвечивает клетки, куда можно походить
function setCanMove(x, y) {
    clearCanMove();
    try {
        if (board[y-(-1)**(count_move%2)][x-1].who == "##") {
            board[y-(-1)**(count_move%2)][x-1].can_move = true;
        }
    } catch (e) {}

    try {
        if (board[y-(-1)**(count_move%2)][x+1].who == "##") {
            board[y-(-1)**(count_move%2)][x+1].can_move = true;
        }
    } catch (e) {}
}

//Возвращает список шашек, которые могут бить
function checkGet() {
    list_can_get = []
    for (let i=0; i<8; i++){
        for (let j=0; j<8; j++){
            if (who_move[count_move%2].includes(board[i][j].who)) {
                if (checkGetKoord(j, i, true)) {
                    list_can_get.push([i, j]);
                }
            }
        }
    }
    return list_can_get;
}

//Возвращает список координат куда можно побить и что побить
function checkGetKoord(x, y, only_check = false) {
    can_move_after_get = []
    for (a = -1; a < 2; a += 2) {
        for (b = -1; b < 2; b += 2) {
            try {
                if (who_move[(count_move+1)%2].includes(board[y+a][x+b].who) & !board[y+a][x+b].was_geted) {
                    if (board[y+a*2][x+b*2].who == "##"){
                        if (only_check) {
                            return true;
                        }
                        can_move_after_get.push([y+a*2, x+b*2, y+a, x+b]);
                    }
                }
            } catch (e) {}
        }
    }
    if (only_check) {
        return false;
    }
    return can_move_after_get;
}

//Очистка побитых шашек
function clearWasGeted() {
    for (let i=0; i<8; i++){
        for (let j=0; j<8; j++){
            if (board[i][j].was_geted) {
                board[i][j].who = "##";
                board[i][j].was_geted = false;
            }
        }
    }
}

//Очистка клеток, в которые можно походить
function clearCanMove() {
    for (let i=0; i<8; i++){
        for (let j=0; j<8; j++){
            board[i][j].can_move = false;
            board[i][j].can_jump = false;
        }
    }
}

//Очистка клеток, которые можно выделить
function clearCanSelect() {
    for (let i=0; i<8; i++){
        for (let j=0; j<8; j++){
            board[i][j].can_select = false;
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
                if (board[i][j].was_geted) {
                    ctx.globalAlpha = 0.5;
                }
                else {
                    ctx.globalAlpha = 1;
                }
                ctx.drawImage(images[board[i][j].who], board[i][j].x, board[i][j].y, 110, 110);
                //может быть выделена
                if (board[i][j].can_select) {
                    ctx.beginPath();
                    ctx.lineWidth = "3";
                    ctx.strokeStyle = "blue";
                    ctx.rect(board[i][j].x, board[i][j].y, 110, 110);
                    ctx.stroke();
                }                
                //выделенная шашка
                if (board[i][j].selected) {
                    ctx.beginPath();
                    ctx.lineWidth = "6";
                    ctx.strokeStyle = "red";
                    ctx.rect(board[i][j].x, board[i][j].y, 110, 110);
                    ctx.stroke();
                }
            }
            //выделленые клетки куда можно ходить или бить
            if (board[i][j].can_move || board[i][j].can_jump) {
                ctx.beginPath();
                ctx.rect(board[i][j].x, board[i][j].y, 110, 110);
                ctx.closePath();
                ctx.fillStyle = "#0087ff";
                ctx.fill();
            }
        }
    }
}