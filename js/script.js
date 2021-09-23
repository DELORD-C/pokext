let efficiency,
    regex = /^(\w| |-|_|:|\.)+(?= <img | <small)/g,
    regexTeam = /(?!<\/span>)(\w| |-|_|:|\.)+(?=<span|$|<img |<div )/g,
    ennemi = {name: null, infos: null},
    calculating = false,
    typeAppened = false,
    player = {name: null, infos: null, team: []},
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
    }, 1000);

function checkAttacks () {
    getEnnemiStats(ennemi.name).then(function(){
        if ($('.movebuttons-nomax').length > 0) {
            $(".movebuttons-nomax").children().each(function(){
                let elemType = $(this).find('.type');
                if (typeof(elemType.attr('base')) == 'undefined') {
                    elemType.attr('base',elemType.html());
                }
                if (ennemi.infos.types.length == 0) {
                    elemType.html(elemType.attr('base') + "<img class='editArrow' src='" + extPath + "images/null.png'>");
                }
                getEfficiency(elemType.attr('base'), ennemi.infos, elemType);
            });
            $(".movebuttons-max").children().each(function(){
                let elemType = $(this).find('.type');
                console.log(elemType.attr('base'), ennemi.infos, elemType);
                if (typeof(elemType.attr('base')) == 'undefined') {
                    elemType.attr('base',elemType.html());
                }
                if (ennemi.infos.types.length == 0) {
                    elemType.html(elemType.attr('base') + "<img class='editArrow' src='" + extPath + "images/null.png'>");
                }
                else {
                    getEfficiency(elemType.attr('base'), ennemi.infos, elemType);
                }
            });
        }
        else {
            $(".movemenu").children().each(function(){
                let elemType = $(this).find('.type');
                console.log(elemType.attr('base'), ennemi.infos, elemType);
                if (typeof(elemType.attr('base')) == 'undefined') {
                    elemType.attr('base',elemType.html());
                }
                if (ennemi.infos.types.length == 0) {
                    elemType.html(elemType.attr('base') + "<img class='editArrow' src='" + extPath + "images/null.png'>");
                }
                else {
                    getEfficiency(elemType.attr('base'), ennemi.infos, elemType);
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

async function getEfficiency (attack, targetTypes, targetElem) {
    return new Promise((resolve) => {
        let tempEff = 0,
            efficient = true;
        $.ajax({
            url: "https://pokeapi.co/api/v2/type/" + attack.toLowerCase() + "/",
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
            }
        });
    });       
}

function getTeam () {
    if (player.team.length == 0) {
        $('.switchmenu > button').each(function(){
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
        $('.switchmenu').attr('analysed', 'true');
        setTimeout(function(){
            $('.editTeamArrow').remove();
            player.team.forEach(teamPkmn => {
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
                        if ($(this).html().match(regexTeam)[0].toLowerCase() == teamPkmn.species.name) {
                            if (tempWeak >= 2) {
                                $(this).append("<div class='editTeamArrow'><img src='" + extPath + "images/red.png'><img class='editTeamArrow' src='" + extPath + "images/red.png'></div>");
                            }
                            else if (tempWeak > 0) {
                                $(this).append("<div class='editTeamArrow'><img src='" + extPath + "images/red.png'></div>");
                            }
                            else if (tempResist >= 2) {
                                $(this).append("<div class='editTeamArrow'><img src='" + extPath + "images/green.png'><img class='editTeamArrow' src='" + extPath + "images/green.png'></div>");
                            }
                            else if (tempResist > 0) {
                                $(this).append("<div class='editTeamArrow'><img src='" + extPath + "images/green.png'></div>");
                            }
                        }
                    });
                    if (typeAppened == false) {
                        $('.battle').append("<a class='typeLink' target='_blank' href='https://www.pokepedia.fr/Table_des_types'>TYPES</a>");
                        typeAppened = true;
                    }
                }, 300);
            });
        }, 300);
    }
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
            return pokeName;
    }
}