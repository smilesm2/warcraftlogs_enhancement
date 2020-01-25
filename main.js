// ==UserScript==
// @name         Warcraft Logs Enhancement
// @namespace    https://github.com/icyblade/warcraftlogs_enhancement
// @version      0.2
// @description  Some Enhancement Scripts of Warcraft Logs
// @author       swqsldz, kingofpowers, icyblade
// @match        https://*.warcraftlogs.com/*
// @run-at       document-idle
// ==/UserScript==
var attributes = ['critSpell', 'hasteSpell', 'mastery', 'versatilityDamageDone'];
var columnNames = ['Crit', 'Haste', 'Mastery', 'Versatility'];
var regex = /\/reports\/([\S\s]+?)#fight=([0-9]+)/;

var PlayerList = new Array();

function initialize() {
    // initialize attribute columns
    for (var i = 0; i < attributes.length; i++) {
        $('<th class="sorting ui-state-default">' + columnNames[i] + '</th>').insertBefore('th.zmdi.zmdi-flag.sorting.ui-state-default');
    }
    for (var i = 0; i < attributes.length; i++) {
        $('<td class="attr-' + attributes[i] + '"></td>').insertBefore('td.zmdi.zmdi-flag');
    }

    // extract fights from ranking page
    $('td.main-table-name').parent().each(function() {
        var player = new Object();

        player.rowID = $(this).attr('id');
        player.name = $(this).find('.players-table-name .main-table-player').text();

        var href = $(this).find('.players-table-name .main-table-player').attr('href');
		if (typeof href != 'undefined'){
            try {
                player.logID = href.match(regex)[1];
                player.fightID = href.match(regex)[2];
                PlayerList.push(player);
            }
            catch(err) {
                console.log(err)
            }
		}
    });
}

function loadFights(index) {
    $.ajax({
        type: 'GET',
        url: 'https://www.warcraftlogs.com/reports/fights-and-participants/' + PlayerList[index].logID + '/0',
        dataType: 'json',
        success: function(data) {
            callback_fights(data, index);
        }
    });
}

function loadStats(rowID, logID, fightID, timestamp, sourceID) {
    $.ajax({
        type: 'GET',
        url: 'https://www.warcraftlogs.com/reports/summary/' + logID + '/' + fightID + '/' + timestamp + '/' + (timestamp + 3000) + '/' + sourceID + '/0/Any/0/-1.0.-1/0',
        success: function(data) {
            callback_stats(data, rowID, logID, fightID, timestamp, sourceID);
        }
    });
}
//row-2144-1 LGxdpc8hbRnBWqg1 6 1981974 15
function callback_stats(data, rowID, logID, fightID, timestamp, sourceID) {
	data = data.split("</tbody>")[0];
	data = data.split("<tbody>")[1];
	data = data.split('<tr class="composition-row"><td class="composition-label">')[1];
	// data = data.split('<table cellspacing=0 class="composition-table" style=""><tbody><span class="composition-entry">Intellect: <span class=estimate>7,254</span></span></span><span class="composition-entry">Stamina: <span class=estimate>7,643</span></span></span>')[1];
	var critSpell = data.split('Crit: <span class=estimate>')[1].split("</span></span></span>")[0];
	var hasteSpell = data.split('Haste: <span class=estimate>')[1].split("</span></span></span>")[0];
	var mastery = data.split('Mastery: <span class=estimate>')[1].split("</span></span></span>")[0];
	var versatilityDamageDone = data.split('Versatility: <span class=estimate>')[1].split("</span></span></span>")[0];
	var data = {
		'critSpell': critSpell,
		'hasteSpell': hasteSpell,
		'mastery': mastery,
		'versatilityDamageDone': versatilityDamageDone
	};
    for (var key in attributes) {
        try {
            $('#' + rowID + ' .attr-' + attributes[key]).html(data[attributes[key]]);
        } catch (e) {
            console.error(e);
            console.error(rowID);
            console.error(data);
        }
    }
}

function callback_fights(data, idx) {
    PlayerList[idx].fight = data;

    for (var j in PlayerList[idx].fight.friendlies) {
        if (PlayerList[idx].fight.friendlies[j].name == PlayerList[idx].name) {
            PlayerList[idx].sourceID = PlayerList[idx].fight.friendlies[j].id;
            break;
        }
    }

    for (var j in PlayerList[idx].fight.fights) {
        if (PlayerList[idx].fight.fights[j].id == PlayerList[idx].fightID) {
            PlayerList[idx].timestamp = PlayerList[idx].fight.fights[j].start_time;
            break;
        }
    }
    loadStats(PlayerList[idx].rowID, PlayerList[idx].logID, PlayerList[idx].fightID, PlayerList[idx].timestamp, PlayerList[idx].sourceID);

    idx++;

    if (idx >= PlayerList.length) {
        console.log(PlayerList);
        return;
    }

    loadFights(idx);
}

function loadAttributes() {
    initialize();
    loadFights(0);
}

function delayLoadAttributes() {
    if ($('.ranking-table tr:eq(1)').length === 0) {
        console.log('delay');
        setTimeout(delayLoadAttributes, 1000);
    } else {
        loadAttributes();
    }
}

delayLoadAttributes();