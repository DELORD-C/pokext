let efficiency,
    reset = false,
    dyna = false,
    itteration = 1,
    regex = /(?!\/)(\w|-)*(?=.gif$)/g,
    regexAttack = /^(\w| |-|_|:|\.)+(?=<br>)/g,
    regexTeam = /(?!<\/span>)(\w| |-|_|:|\.)+(?=<span|$|<img |<div )/g,
    calculating = false,
    ennemi = {name: null, infos: null},
    player = {name: null, infos: null, team: [], moves: {efficientMax: [], goodMax: [], efficient: [], good: [], normalMax: [], normal: [], weak: []}, aiTeam: {superResist: [], resist: [], normal: [], weak: [], active: null}},
    extPath = "chrome-extension://" + chrome.runtime.id + "/",
    intCheck = setInterval(function(){
        if ($('.setchart').length > 0) {
            $('.smogonLink').remove();
            $('.setchart').each(function(){
                $(this).find('.setcol-icon').append("<a target='_blank' class='smogonLink' href='https://www.smogon.com/dex/ss/pokemon/" + $('.setcell-pokemon > input').val().toLowerCase() + "/'>Smogon</a>")
            });
        }
        if ($('.typeLink').length == 0 && $('.battle').length > 0) {
            $('.battle').append("<a class='typeLink' target='_blank' href='https://www.pokepedia.fr/Table_des_types'>TYPES</a>");
            $('.battle').append("<div id='app-cover'><div class='row'><div class='toggle-button-cover'><div class='button r' id='button-3'><input id='AI' type='checkbox' class='checkbox'><div class='knobs'></div><div class='layer'></div></div></div></div></div>");
            ennemi = {name: null, infos: null};
            player = {name: null, infos: null, team: [], moves: {efficientMax: [], goodMax: [], efficient: [], good: [], normal: [], weak: []}, aiTeam: {superResist: [], resist: [], normal: [], weak: [], active: null}};
        }
        if (typeof($('.lstatbar').children().first().html()) != 'undefined' && typeof($('.rstatbar').children().first().html()) != 'undefined') {
            getEnnemiName();
            getPlayerName();
            if (document.getElementsByClassName('movemenu').length > 0 && calculating == false && typeof($('.movemenu').attr('analysed')) == "undefined") {
                console.log(player.name + " VS " + ennemi.name);
                calculating = true;
                $('.movemenu').attr('analysed', 'true');
                checkAttacks();
            }
        }
        if (typeof($('.lstatbar').children().first().html()) != 'undefined' && document.getElementsByClassName('switchmenu').length > 0) {
            if (ennemi.infos == null) {
                getEnnemiName();
                getEnnemiStats(ennemi.name);
            }
            getTeam();
        }
        if($('.switchmenu').length > 0 && typeof($('.lstatbar').children().first().html()) == 'undefined' && typeof($('.rstatbar').children().first().html()) == 'undefined' && $('#AI').is(':checked') && calculating == false) {
            console.log('There is no pokemon alive, random switching.');
            randomSwitch();
        }
        else if ((document.getElementsByClassName('movemenu').length == 0 || $('.movemenu').attr('analysed') == 'true') && $('.switchmenu').attr('analysed') == 'true' && $('#AI').is(':checked') && calculating == false) {
            setTimeout(function(){
                aiPlay();
            }, 500)
        }
        if ($('.battle-controls > p > button').length == 3) {
            if ($('.battle-controls > p > button').last().attr('name') == 'goToEnd') {
                // $('.battle-controls > p > button').last().click();
            }
        }
    }, 1000);

function emptyMoves () {
    player.moves.efficientMax = [];
    player.moves.goodMax = [];
    player.moves.efficient = [];
    player.moves.good = [];
    player.moves.normalMax = [];
    player.moves.normal = [];
    player.moves.weak = [];
}

function emptyTeam () {
    player.aiTeam.superResist = [];
    player.aiTeam.resist = [];
    player.aiTeam.normal = [];
    player.aiTeam.weak = [];
    player.aiTeam.active = null;
}

function checkAttacks () {
    getEnnemiStats(ennemi.name).then(function(){
        emptyMoves();
        if ($('.movebuttons-nomax').length > 0) {
            $(".movebuttons-nomax").children().each(function(){
                let elemType = $(this).find('.type');
                if (typeof(elemType.attr('base')) == 'undefined') {
                    elemType.attr('base',elemType.html());
                }
                if (ennemi.infos.types.length == 0) {
                    elemType.html(elemType.attr('base') + "<img class='editArrow' src='" + extPath + "images/null.png'>");
                }
                else {
                    if ($(this).html().match(regexAttack).length == 0) {
                        console.log("regexAttack can't find attack");
                        console.log($(this).html());
                    }
                    getEfficiency(elemType.attr('base'), ennemi.infos, elemType, $(this).html().match(regexAttack)[0], false);
                }
            });
            $(".movebuttons-max").children().each(function(){
                let elemType = $(this).find('.type');
                if (typeof(elemType.attr('base')) == 'undefined') {
                    elemType.attr('base',elemType.html());
                }
                if (ennemi.infos.types.length == 0) {
                    elemType.html(elemType.attr('base') + "<img class='editArrow' src='" + extPath + "images/null.png'>");
                }
                else {
                    if ($(this).html().match(regexAttack).length == 0) {
                        console.log("regexAttack can't find attack");
                        console.log($(this).html());
                    }
                    getEfficiency(elemType.attr('base'), ennemi.infos, elemType, $(this).html().match(regexAttack)[0], true);
                }
            });
        }
        else {
            $(".movemenu > button").each(function(){
                let elemType = $(this).find('.type');
                if (typeof(elemType.attr('base')) == 'undefined') {
                    elemType.attr('base',elemType.html());
                }
                if (ennemi.infos.types.length == 0) {
                    elemType.html(elemType.attr('base') + "<img class='editArrow' src='" + extPath + "images/null.png'>");
                }
                else {
                    if ($(this).html().match(regexAttack).length == 0) {
                        console.log("regexAttack can't find attack");
                        console.log($(this).html());
                    }
                    dyna = false;
                    if ($('.status .good').length > 0 && $('.status .good').html() == 'Dynamaxed') {
                        getEfficiency(elemType.attr('base'), ennemi.infos, elemType, $(this).html().match(regexAttack)[0], true);
                    }
                    else {
                        getEfficiency(elemType.attr('base'), ennemi.infos, elemType, $(this).html().match(regexAttack)[0], false);
                    }
                }
            });
        }
        setTimeout(function(){
            calculating = false;
        }, 200)
    })
}

async function getEnnemiStats(pkmn) {
    return new Promise((resolve) => {
        $.ajax({
            url: "https://pokeapi.co/api/v2/pokemon/" + sanitizePokeName(pkmn),
            type: 'GET',
            success: (response) => {
                ennemi.infos = response;
                resolve();
            },
            error: () => {
                console.log('unknown pokemon : ' + sanitizePokeName(pkmn));
                ennemi.infos = {species:{name: pokeName}, types: []};
                resolve();
            }
        });
    });
}

async function getEfficiency (attack, targetTypes, targetElem, moveName, maxed) {
    return new Promise((resolve) => {
        let tempEff = 0,
            efficient = true,
            movePower = null;
        $.ajax({
            url: "https://pokeapi.co/api/v2/move/" + moveName.toLowerCase().replaceAll(' ', '-'),
            type: 'GET',
            success: (result) => {
                if (maxed) {
                    if (moveName != 'Max Guard') {
                        movePower = 100;
                    }
                    else {
                        movePower = null;
                    }
                }
                else {
                    movePower = result.power;
                }
                
            },
            error: () => {
                console.log("Can't find attack " + moveName + " on PokeAPI");
            }
        }).then(function(){
            $.ajax({
                url: "https://pokeapi.co/api/v2/type/" + attack.toLowerCase(),
                type: 'GET',
                success: (attackInfos) => {
                    targetTypes.types.forEach(defType => {
                        attackInfos.damage_relations.no_damage_to.forEach(efficientTo => {
                            if (efficientTo.name == defType.type.name) {
                                tempEff = -3
                                efficient = false;
                            }
                        });
                        attackInfos.damage_relations.double_damage_to.forEach(efficientTo => {
                            if (efficientTo.name == defType.type.name && efficient) {
                                tempEff++;
                            }
                        });
                        attackInfos.damage_relations.half_damage_to.forEach(weakTo => {
                            if (weakTo.name == defType.type.name && efficient) {
                                tempEff--;
                            }
                        });
                    });
                    if (movePower != null && movePower > 0 && !targetElem.hasClass('disabled') && typeof(targetElem.parent().attr('disabled')) == 'undefined') {
                        targetElem.attr('power', movePower);
                        if (tempEff == 2 && maxed) {
                            player.moves.efficientMax.push(targetElem);
                        }
                        else if (tempEff == 1 && maxed) {
                            player.moves.goodMax.push(targetElem);
                        }
                        else if (tempEff == 2) {
                            player.moves.efficient.push(targetElem);
                        }
                        else if (tempEff == 1) {
                            player.moves.good.push(targetElem);
                        }
                        else if (tempEff < 0) {
                            player.moves.weak.push(targetElem);
                        }
                        else if (maxed) {
                            player.moves.normalMax.push(targetElem);
                        }
                        else {
                            player.moves.normal.push(targetElem);
                        }
                    }
                    switch (tempEff) {
                        case 2:
                            targetElem.html(targetElem.attr('base') + "<img class='editArrow' src='" + extPath + "images/green.png'><img class='editArrow' src='" + extPath + "images/green.png'>");
                            break;
        
                        case 1:
                            targetElem.html(targetElem.attr('base') + "<img class='editArrow' src='" + extPath + "images/green.png'>");
                            break;
        
                        case -1:
                            targetElem.html(targetElem.attr('base') + "<img class='editArrow' src='" + extPath + "images/red.png'>");
                            break;
    
                        case -2:
                            targetElem.html(targetElem.attr('base') + "<img class='editArrow' src='" + extPath + "images/red.png'><img class='editArrow' src='" + extPath + "images/red.png'>");
                            break;
    
                        case -3:
                            targetElem.html(targetElem.attr('base') + "<img class='editArrow' src='" + extPath + "images/cross.png'>");
                            break;
                    
                        default:
                            break;
                    }
                    resolve();
                }
            });
        });
    });
}

function getTeam () {
    if (player.team.length == 0) {
        $('.switchmenu > button').each(function(){
            if ($(this).html().match(regexTeam).length == 0) {
                console.log('regexTeam can\'t find pokemon');
                console.log($(this).html());
            }
            let pokeName = sanitizePokeName($(this).html().match(regexTeam)[0].toLowerCase());
            $.ajax({
                url: "https://pokeapi.co/api/v2/pokemon/" + pokeName + "/",
                type: 'GET',
                success: (response) => {
                    player.team.push(response);
                },
                error: () => {
                    player.team.push({species:{name: pokeName}, types: []})
                    console.log('unknown pokemon : ' + pokeName);
                }
            });
        });
    }
    else {
        getTeamWeakness();
    }
}

function getTeamWeakness () {
    if (typeof($('.switchmenu').attr('analysed')) == 'undefined') {
        emptyTeam();
        $('.switchmenu').attr('analysed', 'true');
        setTimeout(function(){
            $('.editTeamArrow').remove();
            for (let index = 0; index < player.team.length; index++) {
                const teamPkmn = player.team[index];
                let tempWeak = 0;
                let tempResist = 0;
                ennemi.infos.types.forEach(tempType => {
                    let efficient = true;
                    $.ajax({
                        url: "https://pokeapi.co/api/v2/type/" + tempType.type.name.toLowerCase() + "/",
                        type: 'GET',
                        success: (attackInfos) => {
                            teamPkmn.types.forEach(defType => {
                                attackInfos.damage_relations.no_damage_to.forEach(efficientTo => {
                                    if (efficientTo.name == defType.type.name) {
                                        tempResist++;
                                        tempResist++;
                                    }
                                });
                                attackInfos.damage_relations.double_damage_to.forEach(efficientTo => {
                                    if (efficientTo.name == defType.type.name && efficient == true) {
                                        tempWeak++;
                                    }
                                });
                                attackInfos.damage_relations.half_damage_to.forEach(weakTo => {
                                    if (weakTo.name == defType.type.name && efficient == true) {
                                        tempResist++;
                                    }
                                });
                            });
                        }
                    });
                });
                setTimeout(function(){
                    $('.switchmenu > button').each(function(){
                        if ($(this).html().match(regexTeam).length == 0) {
                            console.log('regexTeam can\'t find pokemon');
                            console.log($(this).html());
                        }
                        if ($(this).html().match(regexTeam)[0].toLowerCase().replaceAll('. ', '-').replaceAll(' ', '-') == teamPkmn.species.name) {
                            $(this).attr('pkmn', $(this).html().match(regexTeam)[0].toLowerCase());
                            if ($(this).html().match(regexTeam)[0].toLowerCase() == player.name) {
                                $(this).attr('resist', tempResist);
                                $(this).attr('weak', tempWeak);
                                player.aiTeam.active = $(this);
                            }
                            if (tempWeak >= 2) {
                                if (!$(this).hasClass('disabled')) {
                                    player.aiTeam.weak.push($(this));
                                }
                                $(this).append("<div class='editTeamArrow'><img src='" + extPath + "images/red.png'><img src='" + extPath + "images/red.png'></div>");
                            }
                            else if (tempWeak > 0) {
                                if (!$(this).hasClass('disabled')) {
                                    player.aiTeam.weak.push($(this));
                                }
                                $(this).append("<div class='editTeamArrow'><img src='" + extPath + "images/red.png'></div>");
                            }
                            else if (tempResist >= 2) {
                                if (!$(this).hasClass('disabled')) {
                                    player.aiTeam.superResist.push($(this));
                                }
                                $(this).append("<div class='editTeamArrow'><img src='" + extPath + "images/green.png'><img src='" + extPath + "images/green.png'></div>");
                            }
                            else if (tempResist > 0) {
                                if (!$(this).hasClass('disabled')) {
                                    player.aiTeam.resist.push($(this));
                                }
                                $(this).append("<div class='editTeamArrow'><img src='" + extPath + "images/green.png'></div>");
                            }
                            else {
                                if (!$(this).hasClass('disabled')) {
                                    player.aiTeam.normal.push($(this));
                                }
                            }
                        }
                    });
                }, 300);
            }
        }, 300);
    }
}

function aiPlay () {
    // console.log(player.moves);
    // console.log(player.aiTeam);
    if ($('.status .good').length > 0 && $('.status .good').html() == 'Dynamaxed') {
        dyna = true;
    }
    if (player.moves.efficientMax.length > 0 && document.getElementsByClassName('movemenu').length > 0 && ($('.rstatbar .hptext').html() == '100%' || dyna == true)) {
        useBestMove(true, player.moves.efficientMax);
        console.log('Using super efficient max move !')
    }
    else if (player.moves.efficient.length > 0 && document.getElementsByClassName('movemenu').length > 0) {
        useBestMove(false, player.moves.efficient);
        console.log('Using super efficient move !')
    }
    else if (player.moves.goodMax.length > 0 && document.getElementsByClassName('movemenu').length > 0 && ($('.rstatbar .hptext').html() == '100%' || dyna == true)) {
        useBestMove(true, player.moves.goodMax);
        console.log('Using efficient max move !')
    }
    else if (player.moves.good.length > 0 && document.getElementsByClassName('movemenu').length > 0) {
        useBestMove(false, player.moves.good);
        console.log('Using efficient move !')
    }
    else if (document.getElementsByClassName('movemenu').length > 0 && player.aiTeam.active != null && parseInt(player.aiTeam.active.attr('resist')) > 0 && player.moves.normal.length > 0 && $('.rstatbar').length > 0) {
        useBestMove(false, player.moves.normal);
        console.log('Using normal move cause the active pokemon has good resists !')
    }
    else if (document.getElementsByClassName('movemenu').length > 0 && player.moves.normal.length > 0 && dyna == true) {
        useBestMove(false, player.moves.normal);
        console.log('Using normal max move cause dynamaxed.')
    }
    else if (document.getElementsByClassName('movemenu').length > 0 && player.moves.normalMax.length > 0 && dyna == true) {
        useBestMove(true, player.moves.normalMax);
        console.log('Using normal max move cause dynamaxed.')
    }
    else if (player.aiTeam.superResist.length > 0) {
        useBestMove(false, player.aiTeam.superResist);
        console.log('Switching to a super resistant pokemon !')
    }
    else if (player.aiTeam.resist.length > 0 && player.aiTeam.active != null && parseInt(player.aiTeam.active.attr('resist')) > 0 ) {
        useBestMove(false, player.aiTeam.resist);
        console.log('Switching to a resistant pokemon !')
    }
    else if (document.getElementsByClassName('movemenu').length > 0 && player.moves.normal.length > 0) {
        useBestMove(false, player.moves.normal);
        console.log('Using normal move.')
    }
    else if (player.aiTeam.normal.length > 0) {
        useBestMove(false, player.aiTeam.normal);
        console.log('Switching to another pokemon.')
    }
    else if (document.getElementsByClassName('movemenu').length > 0 && player.moves.weak.length > 0) {
        useBestMove(false, player.moves.weak);
        console.log('Using weak move...')
    }
    else if (player.aiTeam.weak.length > 0) {
        useBestMove(false, player.aiTeam.weak);
        console.log('Switching to a weak pokemon...')
    }
}

function useBestMove(maxed, array) {
    if (maxed) {
        $('.megaevo').click();
    }
    let selected = {elem: array[0], power: 0};
    array.forEach(move => {
        if (parseInt(move.attr('power')) > selected.power) {
            selected.elem = move;
            selected.power = parseInt(move.attr('power'));
        }
    });
    if (typeof(selected) != 'undefined') {
        selected.elem.click();
    }
    else {
       resetAI(); 
    }
}

function randomSwitch () {
    $('.switchmenu > button').each(function(){
        $(this).click();
    });
}

function getEnnemiName(){
    ennemi.name = $('.backdrop').next().next().next().next().children().first().children().last().attr('src').match(regex)[0];
    if(ennemi.name.match(/-f$/) != null) {
        ennemi.name = ennemi.name.slice(0, -2)
    }
}

function getPlayerName(){
    player.name = $('.backdrop').next().next().next().next().children().last().children().last().attr('src').match(regex)[0];
    if(player.name.match(/-f$/) != null) {
        player.name = player.name.slice(0, -2)
    }
}

function resetAI () {
    if (reset == false) {
        console.log('reseting...');
        reset = true;
        efficiency;
        dyna = false;
        itteration = 1;
        regex = /^(\w| |-|_|:|\.)+(?= <img | <small)/g;
        regexAttack = /^(\w| |-|_|:|\.)+(?=<br>)/g;
        regexTeam = /(?!<\/span>)(\w| |-|_|:|\.)+(?=<span|$|<img |<div )/g;
        calculating = false;
        ennemi = {name: null, infos: null};
        player = {name: null, infos: null, team: [], moves: {efficientMax: [], goodMax: [], efficient: [], good: [], normalMax: [], normal: [], weak: []}, aiTeam: {superResist: [], resist: [], normal: [], weak: [], active: null}};
        $('.movemenu').removeAttr('analysed');
        $('.switchmenu').removeAttr('analysed');
    }
    else {
        setTimeout(function() {
            reset = false;    
        }, 3000);
    }
}

function sanitizePokeName (pokeName) {
    pkmnList = {
        "zacian": "zacian-crowned",
        "meowstic": "meowstic-male",
        "gourgeist": "gourgeist-average",
        "indeedee": "indeedee-female",
        "tornadus": "tornadus-incarnate",
        "landorus": "landorus-incarnate",
        "toxtricity": "toxtricity-amped",
        "tapu fini": "tapu-fini",
        "tapu lele": "tapu-lele",
        "tapu bulu": "tapu-bulu",
        "tapu koko": "tapu-koko",
        "type: null": "type-null",
        "urshifu": "urshifu-rapid-strike",
        "mimikyu": "mimikyu-busted",
        "thundurus": "thundurus-incarnate",
        "lycanroc": "lycanroc-midday",
        "mime-jr": "mime-jr",
        "mr. mime": "mr-mime",
        "mr. rime": "mr-rime",
        "aegislash": "aegislash-shield",
        "kommoo": "kommo-o"
    };
    if (typeof(pkmnList[pokeName]) != 'undefined') {
        return pkmnList[pokeName];
    }
    else {
        return pokeName;
    }
}