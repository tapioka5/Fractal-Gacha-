"use strict";

(function (thisObj) {
    // =========================
    // ウィンドウ作成
    // =========================
    var win = (thisObj instanceof Panel)
        ? thisObj
        : new Window("palette", "フラクタルガチャ");
    $.global.fractalSimpleWin = win;

    // =========================
    // 入力・チェックボックス作成関数
    // =========================
    function createRangeInput(parent, labelText, minVal, maxVal) {
        // グループ
        var group = parent.add("group");
        group.orientation = "column";
        group.alignChildren = ["left", "center"];

        // ラベル
        var label = group.add("statictext", undefined, labelText);
        label.preferredSize.width = 100;

        // 入力ボックス・チェックボックス行
        var rangeGroup = group.add("group");
        rangeGroup.orientation = "row";

        // 入力ボックス
        var min = rangeGroup.add("edittext", undefined, minVal);
        min.preferredSize.width = 40;
        var max = rangeGroup.add("edittext", undefined, maxVal);
        max.preferredSize.width = 40;

        // チェックボックス
        var checkbox = rangeGroup.add("checkbox", undefined);
        checkbox.preferredSize.width = 20;

        return {
            min: min,
            max: max,
            checkbox: checkbox,
        };
    }

    // =========================
    // 入力・チェックボックス生成
    // =========================    
    var contrast = createRangeInput(win, "コントラスト：", 0, 999);
    var brightness = createRangeInput(win, "明るさ：", -100, 100);
    var subInfluence = createRangeInput(win, "サブ影響：", 0, 100);
    var complexity = createRangeInput(win, "複雑度：", 1, 20);

    // ガチャボタン
    var applyButton = win.add("button", undefined, "ガチャ");
    applyButton.preferredSize.width = 60;
    applyButton.alignment = ["center", "center"];

    // =========================
    // 数値上限、下限関数化
    // =========================
    function limitInputValue(inputBox, minLimit, maxLimit, defaultVal) {
        var value = Number(inputBox.text);
        if (inputBox.text === "" || isNaN(value)) {
            inputBox.text = defaultVal;
            return;
        }
        if (value < minLimit) {
            inputBox.text = String(minLimit);
        } else if (value > maxLimit) {
            inputBox.text = String(maxLimit);
        }
    }

    // =========================
    // 例外処理生成
    // ========================= 
    contrast.min.onChange = function () { limitInputValue(contrast.min, 0, 998, 0) };
    contrast.max.onChange = function () { limitInputValue(contrast.max, 1, 999, 999) };
    brightness.min.onChange = function () { limitInputValue(brightness.min, -100, 99, -100) };
    brightness.max.onChange = function () { limitInputValue(brightness.max, -99, 100, 100) };
    subInfluence.min.onChange = function () { limitInputValue(subInfluence.min, 0, 99, 0) };
    subInfluence.max.onChange = function () { limitInputValue(subInfluence.max, 1, 100, 100) };
    complexity.min.onChange = function () { limitInputValue(complexity.min, 1, 19, 1) };
    complexity.max.onChange = function () { limitInputValue(complexity.max, 2, 20, 20) };

    // =========================
    // ボタン処理
    // =========================
    applyButton.onClick = function () {
        //プロジェクト存在確認
        if (!app.project) {
            alert("プロジェクトが開かれていません");
            return;
        }

        //レイヤー選択確認
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem) ||
            comp.selectedLayers.length === 0) {
            alert("レイヤーを選択してください");
            return;
        }

        var activeLayer = comp.selectedLayers[0];

        //AVLayerか判定
        if (!(activeLayer instanceof AVLayer)) {
            alert("このレイヤーにはエフェクトを追加できません");
            return;
        }

        // =========================
        // Undoグループ開始
        // =========================
        app.beginUndoGroup("フラクタルガチャ");
        try {
            //オブジェクトへの参照を取得
            var effects = activeLayer.property("ADBE Effect Parade");
            var fractal = effects.property("ADBE Fractal Noise");

            //フラクタルノイズが存在しないとき追加
            if (!fractal) {
                fractal = effects.addProperty("ADBE Fractal Noise");
            }

            // =========================
            //処理
            // =========================
            //数値取得
            var contrastMin = Math.round(contrast.min.text);
            var contrastMax = Math.round(contrast.max.text);
            var brightnessMin = Math.round(brightness.min.text);
            var brightnessMax = Math.round(brightness.max.text);
            var subInfluenceMin = Math.round(subInfluence.min.text);
            var subInfluenceMax = Math.round(subInfluence.max.text);
            var complexityMin = Math.round(complexity.min.text);
            var complexityMax = Math.round(complexity.max.text);

            var cVal = Math.floor(Math.random() * (contrastMax - contrastMin + 1)) + contrastMin;
            var bVal = Math.floor(Math.random() * (brightnessMax - brightnessMin + 1)) + brightnessMin;
            var sVal = Math.floor(Math.random() * (subInfluenceMax - subInfluenceMin + 1)) + subInfluenceMin;
            var aVal = Math.floor(Math.random() * (complexityMax - complexityMin + 1)) + complexityMin;

            //プロパティ取得
            var contrastProp = fractal.property("ADBE Fractal Noise-0004");
            var brightnessProp = fractal.property("ADBE Fractal Noise-0005");
            var subInfluenceProp = fractal.property("ADBE Fractal Noise-0017");
            var complexityProp = fractal.property("ADBE Fractal Noise-0015");

            //キーフレーム判定、削除
            while (contrastProp.numKeys > 0) {
                contrastProp.removeKey(1);
            }
            while (brightnessProp.numKeys > 0) {
                brightnessProp.removeKey(1);
            }
            while (subInfluenceProp.numKeys > 0) {
                subInfluenceProp.removeKey(1);
            }
            while (complexityProp.numKeys > 0) {
                complexityProp.removeKey(1);
            }

            //コントラスト出力
            if (contrast.checkbox.value) { contrastProp.setValue(cVal); }
            //明るさ出力
            if (brightness.checkbox.value) { brightnessProp.setValue(bVal); }
            //サブ影響出力
            if (subInfluence.checkbox.value) { subInfluenceProp.setValue(sVal); }
            //複雑度出力
            if (complexity.checkbox.value) { complexityProp.setValue(aVal); }

        } finally {
            //Undoグループ終了
            app.endUndoGroup();
        }
    }

    // =========================
    // 表示
    // =========================
    if (win instanceof Window) {
        win.center();
        win.show();
    } else {
        win.layout.layout(true);
    }
}
)(this);

