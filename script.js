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
}

//Вывод массива (всех ячеек доски)
function printArr(arr){
    for (let i=0; i < arr.length; i++) {
        s = ''
        for (let j=0; j < arr[i].length; j++){
            s += arr[j][i].who+' '
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
    bqSVG = document.getElementById("bq");
    wcSVG = document.getElementById("wc");
    wqSVG = document.getElementById("wq");
    boardSVG = document.getElementById("board");
    can_selectSVG = document.getElementById("can_select");
    images = {
        "bc": bcSVG,
        "bq": bqSVG,
        "wc": wcSVG,
        "wq": wqSVG,
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
            arr.push(new Cell('b', c, charArr[i]+(8-j), 60+i*110, 60+j*110, false, false, false, false, [], false, false, []));
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

    if (board[x][y].can_select) {
        board[selected.x][selected.y].selected = false;
        board[x][y].selected = true;
        selected.x = x;
        selected.y = y;
        setCanMoveOrJump(x, y);
        draw();
    }
    if (board[x][y].can_move) {
        move_to(x, y);
    }
    if (board[x][y].can_jump) {
        jump_to(x, y);
    }
}

//Проверка становится ли шашка дамкой
function ifNeedMakeQueen(x, y) {
    if (board[x][y].who[1] != "q" && y == (count_move%2)*7) {
        console.log(board[x][y].koord+" become a queen")
        board[x][y].who = board[x][y].who[0]+"q";
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
    l = board[x][y].eat_after_jump;
    board[l[0]][l[1]].was_geted = true;
    board[x][y].who = board[selected.x][selected.y].who;
    board[selected.x][selected.y].who = "##";
    board[selected.x][selected.y].selected = false;
    clearCanMove();
    clearCanSelect();
    if (!checkGetKoord(x, y, true)){
        clearWasGeted();
        must_get = false;
        ifNeedMakeQueen(x, y);
        count_move++;
        mustMove();
    } else {
        must_get = true;
        board[x][y].can_select = true;
        board[x][y].selected = true;
        selected.x = x;
        selected.y = y;
        ifNeedMakeQueen(x, y);
        setCanJump(x, y);
    }
    draw();
}

//Функция перемещения шашки в заданные координаты
function move_to(x, y) {
    board[x][y].who = board[selected.x][selected.y].who;
    board[selected.x][selected.y].who = "##";
    board[selected.x][selected.y].selected = false;
    clearCanMove();
    clearCanSelect();
    ifNeedMakeQueen(x, y);
    count_move++;
    mustMove();
    draw();
}

//Отмечает шашки, которые могут/должны ходить/бить
function mustMove() {
    l = []; // список отмеченных шашек (если только одна, то автоматически выделяем)
    list_can_get = checkGet();
    if (list_can_get.length != 0) {
        must_get = true;
        for (i=0; i<list_can_get.length; i++) {
            board[list_can_get[i][0]][list_can_get[i][1]].can_select = true;
            l.push([list_can_get[i][0], list_can_get[i][1]]);
        }
    } else {
        list_can_move = checkMove();
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
        selected.x = l[0][0];
        selected.y = l[0][1];
        setCanMoveOrJump(l[0][0], l[0][1]);
    }
}

//Возвращает список координат шашек, которые могут ходить
function checkMove() {
    list_can_move = []
    for (let i=0; i<8; i++){
        for (let j=0; j<8; j++){
            if (who_move[count_move%2].includes(board[i][j].who)) {
                can_move = false;
                //Проверка клеток для шашки и дамки (ход вперёд)
                try {
                    if (board[i-1][j-(-1)**(count_move%2)].who == "##") {
                        can_move = true;
                    }
                } catch (e) {}
                try {
                    if (board[i+1][j-(-1)**(count_move%2)].who == "##") {
                        can_move = true;
                    }
                } catch (e) {}
                //Дополнительная роверка для дамки (ход назад)
                if (board[i][j].who[1] == "q") {
                    try {
                        if (board[i-1][j+(-1)**(count_move%2)].who == "##") {
                            can_move = true;
                        }
                    } catch (e) {}
                    try {
                        if (board[i+1][j+(-1)**(count_move%2)].who == "##") {
                            can_move = true;
                        }
                    } catch (e) {}
                }

                if (can_move) {
                    list_can_move.push([i,j]);
                }
            }
        }
    }
    return list_can_move;
}

function checkIfQueenCanEatMore(figure, l) {
    result = [];
    for (i=0; i<l.length; i++) {
        x = l[i].x;
        y = l[i].y;
        x_eat = l[i].x_eat;
        y_eat = l[i].y_eat;
        s = board[x_eat][y_eat].was_geted;
        board[x_eat][y_eat].was_geted = true;
        if (checkGetKoord(x, y, true, figure)) {
            result.push(l[i]);
        }
        board[x_eat][y_eat].was_geted = s;
    }
    if (result.length == 0) {
        return l;
    } else {
        return result;
    }
}

//Подсвечивает клетки, куда можно побить
function setCanJump(x, y) {
    clearCanMove();
    l = checkGetKoord(x, y);
    figure = board[x][y].who;
    if (figure[1] == "q") {
        l = checkIfQueenCanEatMore(figure, l);
    }
    for (i=0; i<l.length; i++) {
        board[l[i].x][l[i].y].can_jump = true;
        board[l[i].x][l[i].y].eat_after_jump = [l[i].x_eat, l[i].y_eat];
    }
}

//Подсвечивает клетки, куда можно походить
function setCanMove(x, y) {
    clearCanMove();
    // Для шашки
    if (board[x][y].who[1] == "c") {
        try {
            if (board[x-1][y-(-1)**(count_move%2)].who == "##") {
                board[x-1][y-(-1)**(count_move%2)].can_move = true;
            }
        } catch (e) {}

        try {
            if (board[x+1][y-(-1)**(count_move%2)].who == "##") {
                board[x+1][y-(-1)**(count_move%2)].can_move = true;
            }
        } catch (e) {}
    } else { // Для дамки
        for (a=-1; a<2; a+=2) {
            for (b=-1; b<2; b+=2) {
                for (n=1; n<8; n++) {
                    try {
                        if (board[x+a*n][y+b*n].who == "##") {
                            board[x+a*n][y+b*n].can_move = true;
                        } else {
                            break;
                        }
                    } catch (e) {}
                }
            }
        }
    }
}

//Возвращает список шашек, которые могут бить
function checkGet() {
    list_can_get = []
    for (let i=0; i<8; i++){
        for (let j=0; j<8; j++){
            if (who_move[count_move%2].includes(board[i][j].who)) {
                if (checkGetKoord(i, j, true)) {
                    list_can_get.push([i, j]);
                }
            }
        }
    }
    return list_can_get;
}

//Возвращает список координат куда можно побить и что побить
function checkGetKoord(x, y, only_check = false, figure = false) {
    can_move_after_get = []
    if (!figure) {
        figure = board[x][y].who;
    }
    //Проверка для шашки
    if (figure[1] == "c") {
        for (a = -1; a < 2; a += 2) {
            for (b = -1; b < 2; b += 2) {
                try {
                    if (who_move[(count_move+1)%2].includes(board[x+a][y+b].who) & !board[x+a][y+b].was_geted) {
                        if (board[x+a*2][y+b*2].who == "##"){
                            if (only_check) {
                                return true;
                            }
                            can_move_after_get.push({'x':x+a*2, 'y':y+b*2, 'x_eat':x+a, 'y_eat':y+b});
                        }
                    }
                } catch (e) {}
            }
        }
    } else { //Проверка для дамки
        for (a = -1; a < 2; a += 2) {
            for (b = -1; b < 2; b += 2) {
                find = false;
                eat = [];
                for (n=1; n<8; n++) {
                    try {
                        if (find) {
                            if (board[x+a*n][y+b*n].who == "##") {
                                if (only_check) {
                                    return true;
                                }
                                can_move_after_get.push({'x':x+a*n, 'y':y+b*n, 'x_eat':eat[0], 'y_eat':eat[1]})
                            } else {
                                break;
                            }
                        }

                        if (who_move[(count_move+1)%2].includes(board[x+a*n][y+b*n].who) & !board[x+a*n][y+b*n].was_geted) {
                            find = true;
                            eat = [x+a*n, y+b*n];
                        } 
                    } catch (e) {
                        break;
                    }
                }
            }
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
                if (j < 3 ){board[i][j].who = 'bc';}
                if (j > 4){board[i][j].who = 'wc';}
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
                    ctx.drawImage(can_selectSVG, board[i][j].x, board[i][j].y, 110, 110);
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
                ctx.fillStyle = "#4da6ff";
                ctx.fill();
            }
        }
    }
}