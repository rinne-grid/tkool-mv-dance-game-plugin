//=============================================================================
// DanceGame.js
// Copyright (c) 2015 rinne_grid
// This plugin is released under the MIT license.
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc
 * @author
 *
 * @help
 */

/*:ja
 * @plugindesc ダンレボ風の音ゲーです。BGMにあわせて流れてくる矢印をタイミングよく押下します。
 * @author rinne_grid
 *
 * @help
 * プラグインコマンド
 *   DanceGame play 1   # playlist["1"]の曲を開始する
 */

function Scene_DanceGame() {
    this.initialize.apply(this, arguments);
}

Scene_DanceGame.prototype = Object.create(Scene_Base.prototype);
Scene_DanceGame.prototype.constructor = Scene_DanceGame;

Scene_DanceGame.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);

};

//=============================================================================
// ● ゲーム設定
//=============================================================================
Scene_DanceGame.prototype.settings =
{
    // game_settings
    "title_font_size": 30,

    // music_settings
    "playlist" : {
        "1": {
            "velocity": 30,

            "bgm": {
                "name":"monost",
                "pan":0,
                "pitch":100,
                "volume":90
            },
            "velocities": [240, 100, 100, 100,
                100, 100, 100, 100, 50,
                45, 100, 100, 100, 50,
                40, 100, 50, 50, 50, 50, 50,
                40, 100, 50, 50, 50, 50, 50],
            "arrows": ["d", "l", "u", "r",
                "d", "d", "l", "u", "u",
                "d", "d", "l", "u", "u",
                "d", "d", "l", "u", "u", "l", "r",
                "d", "d", "l", "u", "u", "l", "r"],
            "speed": 2,
            "music_name": "モノクロストリング"
        }/*,
        "2": {
            "velocity": 30,

            "bgm": {
                "name":"any_music",
                "pan":0,
                "pitch":100,
                "volume":90
            },
            "velocities": [],
            "arrows": ["d", "l", "u", "r"], // d:下、l:左、u:上、r:右
            "speed": 2,
            "music_name": "任意の曲"
        }
        */
    },

    // arrow_settings
    "arrow_flash_color": [0, 0, 128, 128],

    // score_settings
    "good_score": 500,
    "ok_score": 250,
    "bad_score": 0 // 減点したい場合はここに指定
};

Scene_DanceGame.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
};

//=============================================================================
// ● Scene_DanceGame開始
//=============================================================================
Scene_DanceGame.prototype.start = function() {
    Scene_Base.prototype.start.call(this);

    // 矢印データの読み込み
    this._arrow_down_image  = ImageManager.loadPicture("arrow_down");
    this._arrow_left_image  = ImageManager.loadPicture("arrow_left");
    this._arrow_up_image    = ImageManager.loadPicture("arrow_up");
    this._arrow_right_image = ImageManager.loadPicture("arrow_right");

    this._velocity = 20;
    this._arrow_size_x = 64;
    this._arrow_size_y = 64;

    // ボトムメニューの作成
    this.create_bottom_menu();

    // 設定から曲を選択
    this._current_game = this.settings["playlist"][$gameSystem.DanceGameIndex];

    // 矢印の出現制御の選択
    // velocitiesに指定されている場合は、矢印ごとに発生頻度を制御
    this._velocities = [].concat(this._current_game["velocities"]);
    this._velocity = this._current_game["velocity"];

    if(this._velocities != null && this._velocities.length > 0) {
        this._velocity = this._velocities.shift();
        this._ctl_vel_ary = true;
    } else {
        this._ctl_vel_ary = false;
    }

    // 速度の指定　単位：1フレーム
    this._speed = this._current_game["speed"];
    this._arrows = [].concat(this._current_game["arrows"]);

    this._sp_array = [];
    //this._del_sp_array = [];

    // スコア
    this._score = 0;

    // コンボ
    this._combo = 0;

    this._good_count = 0;
    this._ok_count = 0;
    this._bad_count = 0;

    this._max_combo_count = 0;

    // タイトル作成
    this._title_text = this.factory_sprite_and_bitmap(320, 0, 300, 300);
    this._title_text.bitmap.fontSize = this.settings["title_font_size"];
    this._title_text.bitmap.drawText(this._current_game["music_name"], 0, 0, 300, 50);
    this.addChild(this._title_text);

    // 矢印フロー数
    this._flow_max = this._arrows.length;

    AudioManager.playBgm(this._current_game["bgm"]);


};

//=============================================================================
// ● ゲーム更新
//=============================================================================
Scene_DanceGame.prototype.update = function() {
    Scene_Base.prototype.update.call(this);

    // 矢印の出現制御
    if(this._velocity <= 0) {
        var ptn = this._arrows.shift();
        this._sp_array.push(this.factory_arrow(ptn, 0));
        //this._velocity = this._current_game["velocity"];

        if(this._ctl_vel_ary) {
            if(this._velocities.length > 0) {
                this._velocity = this._velocities.shift();
            } else {
                this._velocity = 0;
            }
        } else {
            this._velocity = this._current_game["velocity"];
        }

    } else {

        this._velocity -= 1;
    }

    for(var i = 0; i < this._sp_array.length; i++) {
        var temp_sp = this._sp_array[i];
        if (temp_sp) {
            temp_sp.y += this._speed;

            if (temp_sp.y > Graphics.height) {
                this.removeChild(temp_sp);
                //this._del_sp_array.push(temp_sp);
                console.log(temp_sp.y);

                this._bad_count += 1;

                if(this._combo > this._max_combo_count) {
                    this._max_combo_count = this._combo;
                }
                this._combo = 0;

                this._score -= this.settings["bad_score"];
                this._sp_array[i] = null;
            }
        }
    }

    //for(var dl in this._del_sp_array) {
    //    // Spriteの解放処理
    //    this.removeChild(dl);
    //}

    this.do_handle_game_key();

    this.check_game_over();
};

//=============================================================================
// ● ゲーム終了チェック
//=============================================================================
Scene_DanceGame.prototype.check_game_over = function() {
    var total_arrow_num = this._good_count + this._ok_count + this._bad_count;
    if(total_arrow_num === this._flow_max) {
        if(this._max_combo_count > this._combo) {
            this._combo = this._max_combo_count;
        }
        $gameMessage.add("スコア:"+this._score+"\n"+"コンボ数:"+this._combo);
        AudioManager.fadeOutBgm(2);
        SceneManager.pop();
    }
};

//=============================================================================
// ● 矢印オブジェクトを返却する
//-----------------------------------------------------------------------------
// direction 方向用の識別子
//=============================================================================
Scene_DanceGame.prototype.factory_arrow = function(direction, y) {
    var _arrow = new Sprite();

    if(direction == "d") {
        _arrow.bitmap = this._arrow_down_image;
        _arrow.x = 0;
        _arrow.y = y;

    } else if(direction == "l") {
        _arrow.bitmap = this._arrow_left_image;
        _arrow.x = this._arrow_size_x;
        _arrow.y = y;

    } else if(direction == "u") {
        _arrow.bitmap = this._arrow_up_image;
        _arrow.x = this._arrow_size_x * 2;
        _arrow.y = y;

    } else if(direction == "r") {
        _arrow.bitmap = this._arrow_right_image;
        _arrow.x = this._arrow_size_x * 3;
        _arrow.y = y;

    } else if(direction == ".") {
        _arrow.x = this._arrow_size_x * 4;
        _arrow.y = y;
    }
    _arrow.visible = true;
    this.addChild(_arrow);
    return _arrow;

};

//=============================================================================
// ● Bitmapを設定したSpriteオブジェクトを返却する
//=============================================================================
Scene_DanceGame.prototype.factory_sprite_and_bitmap = function(x, y, width, height) {
    var _sprite = new Sprite();
    _sprite.bitmap = new Bitmap(width, height);
    _sprite.x = x;
    _sprite.y = y;
    return _sprite;
};

//=============================================================================
// ● メニュー部品の作成
//=============================================================================
Scene_DanceGame.prototype.create_bottom_menu = function() {

    // 矢印の作成
    this._down_arrow    = this.factory_arrow("d", Graphics.height - this._arrow_size_y*2);
    this._left_arrow    = this.factory_arrow("l", Graphics.height - this._arrow_size_y*2);
    this._up_arrow      = this.factory_arrow("u", Graphics.height - this._arrow_size_y*2);
    this._right_arrow   = this.factory_arrow("r", Graphics.height - this._arrow_size_y*2);

    // スコアの作成
    var score_y = 100;
    this._score_text = this.factory_sprite_and_bitmap(540, score_y, 200, 30, 2);
    this._score_text.bitmap.drawText("0", 0, 0, 200, 30);
    this._score_str = this.factory_sprite_and_bitmap(320, score_y, 200, 30);
    this._score_str.bitmap.drawText("スコア", 0, 0, 200, 30);

    // コンボの作成
    this._combo_text = this.factory_sprite_and_bitmap(540, score_y+30, 200, 30, 2);
    this._combo_text.bitmap.drawText("0", 0, 0, 200, 30);
    this._combo_str = this.factory_sprite_and_bitmap(320, score_y+30, 200, 30);
    this._combo_str.bitmap.drawText("コンボ", 0, 0, 200, 30);

    // DEADラインの作成
    console.log(Graphics.height);
    var dead_line_size = 2;
    this._dead_line = this.factory_sprite_and_bitmap(0, Graphics.height - dead_line_size,
        Graphics.width, dead_line_size);
    this._dead_line.bitmap.fillRect(0, 0, 256, 16, "#ff0000");


    this.addChild(this._score_str);
    this.addChild(this._score_text);
    this.addChild(this._combo_str);
    this.addChild(this._combo_text);
    this.addChild(this._dead_line);
};

Scene_DanceGame.prototype.clear_blend_arrow = function(arrow) {
    arrow.setBlendColor([0, 0, 0, 0]);
};


//=============================================================================
// ● キー入力の処理
//=============================================================================
Scene_DanceGame.prototype.do_handle_game_key = function() {

    if(Input.isTriggered("down")) {
        this._down_arrow.setBlendColor(this.settings["arrow_flash_color"]);
        setTimeout(this.clear_blend_arrow.bind(this, this._down_arrow), 100);
        this.check_arrow_collision(this._down_arrow, "d");
    }

    if(Input.isTriggered("left")) {
        this._left_arrow.setBlendColor(this.settings["arrow_flash_color"]);
        setTimeout(this.clear_blend_arrow.bind(this, this._left_arrow), 100);
        this.check_arrow_collision(this._left_arrow, "l");
    }

    if(Input.isTriggered("up")) {
        this._up_arrow.setBlendColor(this.settings["arrow_flash_color"]);
        setTimeout(this.clear_blend_arrow.bind(this, this._up_arrow), 100);
        this.check_arrow_collision(this._up_arrow, "u");
    }

    if(Input.isTriggered("right")) {
        this._right_arrow.setBlendColor(this.settings["arrow_flash_color"]);
        setTimeout(this.clear_blend_arrow.bind(this, this._right_arrow), 100);
        this.check_arrow_collision(this._right_arrow, "r");
    }



};

//=============================================================================
// ● 矢印の衝突判定
//=============================================================================
Scene_DanceGame.prototype.check_arrow_collision = function(target_arrow, direction) {
    for(var i = 0; i < this._sp_array.length; i++) {
        var _temp_sp = this._sp_array[i];

        if(_temp_sp != null) {
            var temp_direction = this.get_arrow_direction(_temp_sp);

            // y座標の差分を計算し、評価すべき矢印かどうかを判断する
            diff = Math.abs(target_arrow.y - _temp_sp.y);
            if(diff <= this._arrow_size_y && direction == temp_direction) {
                // Good: 差分が16以内の場合
                if(diff <= this._arrow_size_y / 4) {
                    this.removeChild(_temp_sp);
                    this._score += this.settings["good_score"];
                    this._combo += 1;
                    this._good_count += 1;
                    console.log("Good");
                    console.log(this._combo);
                } else if(diff <= this._arrow_size_y / 2) {
                    this._score += this.settings["ok_score"];
                    this._combo += 1;
                    this._ok_count += 1;
                    console.log("ok");
                    this.removeChild(_temp_sp);
                } else {
                    this._score -= this.settings["bad_score"];
                    this._combo = 0;
                    this._bad_count += 1;
                    if(this._combo > this._max_combo_count) {
                        this._max_combo_count = this._combo;
                    }
                    console.log("bad");
                    this.removeChild(_temp_sp);
                }

                this._sp_array[i] = null;

                // スコア更新
                this.update_score_text();
            }
        }
    }
};

Scene_DanceGame.prototype.update_score_text = function() {
    this._score_text.bitmap.clear();
    this._score_text.bitmap.drawText(this._score, 0, 0, 200, 30);

    this._combo_text.bitmap.clear();
    this._combo_text.bitmap.drawText(this._combo, 0, 0, 200, 30);


};

//=============================================================================
// ● 矢印のx座標から矢印の向きを特定する
//=============================================================================
Scene_DanceGame.prototype.get_arrow_direction = function(arrow) {
    direction = "";
    if(arrow.x == 0) {
        direction = "d";
    } else if(arrow.x == this._arrow_size_x) {
        direction = "l";
    } else if(arrow.x == this._arrow_size_x*2) {
        direction = "u";
    } else if(arrow.x == this._arrow_size_x*3){
        direction = "r";
    }
    return direction;
};


//=============================================================================
// ● プラグイン呼び出し用
//=============================================================================
(function() {
    var parameters = PluginManager.parameters('DanceGame');

    var _Game_Interpreter_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);

        if(command === "DanceGame") {
            switch(args[0]) {
                case 'play':
                    Game_System.prototype.DanceGameIndex = Number(args[1]);
                    SceneManager.push(Scene_DanceGame);
                break;

            }
        }
    }

})();