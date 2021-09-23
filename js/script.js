let efficiency,
    itteration = 1,
    regex = /^(\w| |-|_|:|\.)+(?= <img | <small)/g,
    regexAttack = /^(\w| |-|_|:|\.)+(?=<br>)/g,
    regexTeam = /(?!<\/span>)(\w| |-|_|:|\.)+(?=<span|$|<img |<div )/g,
    ennemi = {name: null, infos: null},
    calculating = false,
    typeAppened = false,
    player = {name: null, infos: null, team: [], moves: {efficientMax: [], goodMax: [], efficient: [], good: [], normal: [], weak: []}, aiTeam: {superResist: [], resist: [], normal: [], weak: []}},
    extPath = "chrome-extension://" + chrome.runtime.id + "/",
    intCheck = setInterval(function(){
        if (typeof($('.lstatbar').children().first().html()) != 'undefined' && typeof($('.rstatbar').children().first().html()) != 'undefined') {
            ennemi.name = $('.lstatbar').children().first().html().match(regex)[0].toLowerCase();
            player.name = $('.rstatbar').children().first().html().match(regex)[0].toLowerCase();
            if (document.getElementsByClassName('movemenu').length > 0 && calculating == false && typeof($('.movemenu').attr('analysed')) == "undefined") {
                console.log(player.name + " VS " + ennemi.name);
                calculating = true;
                $('.movemenu').attr('analysed', 'true');
                checkAttacks();
            }
        }
        if (typeof($('.lstatbar').children().first().html()) != 'undefined' && document.getElementsByClassName('switchmenu').length > 0) {
            if (ennemi.infos == null) {
                ennemi.name = $('.lstatbar').children().first().html().match(regex)[0].toLowerCase();
                getEnnemiStats(ennemi.name);
            }
            getTeam();
        }
        if ((document.getElementsByClassName('movemenu').length == 0 || $('.movemenu').attr('analysed') == 'true') && $('.switchmenu').attr('analysed') == 'true' && $('#AI').is(':checked')) {
            aiPlay();
        }
        if ($('.battle-controls > p > button').length == 3) {
            if ($('.battle-controls > p > button').last().attr('name') == 'goToEnd') {
                $('.battle-controls > p > button').last().click();
            }
        }
    }, 1000);

function emptyMoves () {
    player.moves.efficientMax = [];
    player.moves.goodMax = [];
    player.moves.efficient = [];
    player.moves.good = [];
    player.moves.normal = [];
    player.moves.weak = [];
}

function emptyTeam () {
    player.aiTeam.superResist = [];
    player.aiTeam.resist = [];
    player.aiTeam.normal = [];
    player.aiTeam.weak = [];
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
                    getEfficiency(elemType.attr('base'), ennemi.infos, elemType, $(this).html().match(regexAttack)[0], false);
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
                    movePower = result.power;
                },
                error: () => {
                    console.log("Can't find attack " + moveName + " on PokeAPI");
                }
            });

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
                if (movePower != null && movePower > 0 && !targetElem.hasClass('disabled')) {
                    if (tempEff > 1 && maxed) {
                        player.moves.efficientMax.push(targetElem);
                    }
                    else if (tempEff == 1 && maxed) {
                        player.moves.goodMax.push(targetElem);
                    }
                    else if (tempEff > 1) {
                        player.moves.efficient.push(targetElem);
                    }
                    else if (tempEff == 1) {
                        player.moves.good.push(targetElem);
                    }
                    else if (tempEff < 0) {
                        player.moves.weak.push(targetElem);
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
                        if (sanitizePokeName($(this).html().match(regexTeam)[0].toLowerCase()) == teamPkmn.species.name) {
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
                                    console.log('______________');
                                    console.log($(this));
                                    console.log('RESIST');
                                    console.log($(this).hasClass('disabled'));
                                    console.log('______________');
                                    player.aiTeam.resist.push($(this));
                                    console.log(player.aiTeam);
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
                    if (typeAppened == false) {
                        $('.battle').append("<a class='typeLink' target='_blank' href='https://www.pokepedia.fr/Table_des_types'>TYPES</a>");
                        $('.battle').append("<div id='app-cover'><div class='row'><div class='toggle-button-cover'><div class='button r' id='button-3'><input id='AI' type='checkbox' class='checkbox'><div class='knobs'></div><div class='layer'></div></div></div></div></div>");
                        typeAppened = true;
                    }
                }, 300);
            }
        }, 300);
    }
}

function aiPlay () {
    console.log(player.moves);
    console.log(player.aiTeam);
    if (document.getElementsByClassName('movemenu').length > 0) {
        if (player.moves.efficientMax.length > 0) {
            randomUse(player.moves.efficientMax);
        }
        else if (player.moves.efficient.length > 0) {
            randomUse(player.moves.efficient);
        }
        else if (player.moves.goodMax.length > 0) {
            randomUse(player.moves.goodMax);
        }
        else if (player.moves.good.length > 0) {
            randomUse(player.moves.good);
        }
        else if (player.aiTeam.superResist.length > 0) {
            randomUse(player.aiTeam.superResist);
        }
        else if (player.aiTeam.resist.length > 0) {
            randomUse(player.aiTeam.resist);
        }
        else if (player.moves.normal.length > 0) {
            randomUse(player.moves.normal);
        }
        else if (player.aiTeam.normal.length > 0) {
            randomUse(player.aiTeam.normal);
        }
        else if (player.moves.weak.length > 0) {
            randomUse(player.moves.weak);
        }
        else {
            randomUse(player.aiTeam.weak);
        }
    }
    else {
        if (player.aiTeam.superResist.length > 0) {
            randomUse(player.aiTeam.superResist);
        }
        else if (player.aiTeam.resist.length > 0) {
            randomUse(player.aiTeam.resist);
        }
        else if (player.aiTeam.resist.length > 0) {
            randomUse(player.aiTeam.normal);
        }
        else {
            randomUse(player.aiTeam.weak);
        }
    }
}

function randomUse(array) {
    console.log(array);
    let currentIndex = array.length,  randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    array[0].click();
}

function sanitizePokeName (pokeName) {
    switch (pokeName) {
        case "mr. rime":
            return "mr-rime";

        case "mr. mime":
            return "mr-mime";

        case "mime-jr":
            return "mime-jr";

        case "lycanroc":
            return "lycanroc-midday";

        case "thundurus":
            return "thundurus-therian";

        case "mimikyu":
            return "mimikyu-busted";
        
        case "urshifu":
            return "urshifu-rapid-strike";

        case "type: null":
            return "type-null";

        case "tapu koko":
            return "tapu-koko";

        case "tapu bulu":
            return "tapu-bulu";

        case "tapu lele":
            return "tapu-lele";

        case "tapu fini":
            return "tapu-fini";

        case "toxtricity":
            return "toxtricity-amped";

        case "lycanroc":
            return "lycanroc-midday";

        case "thundurus":
            return "thundurus-therian";

        case "mimikyu":
            return "mimikyu-busted";
        
        case "urshifu":
            return "urshifu-rapid-strike";

        case "type: null":
            return "type-null";

        case "tapu koko":
            return "tapu-koko";

        case "tapu bulu":
            return "tapu-bulu";

        default:
            return pokeName.replaceAll(' ', '-');
    }
}