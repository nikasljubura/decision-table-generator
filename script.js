const tableBody = document.querySelector("#dynamicTable tbody");
const leftTableBody = document.querySelector("#leftTable tbody");
const alphaValueDisplay = document.querySelector("#alphaValue");

const singleButton = document.querySelector("#single_solution");
const differentButton = document.querySelector("#different_solutions");
const alphaSlider = document.querySelector("#alphaSlider");

function resetAlpha() {
    alphaSlider.value = 0; 
    alphaValueDisplay.textContent = "α = 0"; 
}

// citaj sa alfa slidera
alphaSlider.addEventListener("input", () => {
    const alpha = parseFloat(alphaSlider.value).toFixed(2);
    alphaValueDisplay.textContent = `α = ${alpha}`;
    updateAlphaColumn(alpha);
});

// azuriranje hurwicza
function updateAlphaColumn(alpha) {
    const rows = tableBody.querySelectorAll("tr");

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length > 7) {
            const si = parseFloat(cells[6].textContent);
            const oi = parseFloat(cells[7].textContent);
            const alphaValue = alpha * si + (1 - alpha) * oi;

            cells[8].textContent = alphaValue.toFixed(2);
        }
    });
}

function generateTableSecond() {
    // x je element [5, 8]
    const x = Math.floor(Math.random() * (8 - 5 + 1)) + 5;
    let MAX_H, MIN_LP;
    do {
        MAX_H = Math.floor(Math.random() * 5);
        MIN_LP = Math.floor(Math.random() * 5);
    } while (MAX_H === MIN_LP);

    const size = 5;
    const table = Array.from({ length: size }, () => Array(size).fill(0));

    for (let col = 0; col < size; col++) {
        table[0][col] = x;
    }

    // generiranje reda za laplacea - x-2 na MIN_LP, a na ostale [x+1, 9]
    for (let col = 0; col < size; col++) {
        if (col === MIN_LP) {
            table[1][col] = x - 2;
        } else {
            table[1][col] = Math.floor(Math.random() * (9 - (x + 1) + 1)) + (x + 1);
        }
    }

    // hurwicz - 10 u MAX_H ostale 0
    for (let col = 0; col < size; col++) {
        if (col === MAX_H) {
            table[2][col] = 10;
        } else {
            table[2][col] = 0;
        }
    }

    // savage - maks iz stupca - 1
    for (let col = 0; col < size; col++) {
        table[4][col] = Math.floor(Math.random() * x);
    }

    // random red vrijednosti do x-1
    for (let col = 0; col < size; col++) {
        let maxInColumn = Math.max(table[0][col], table[1][col], table[2][col], table[4][col]);
        table[3][col] = maxInColumn - 1;
    }

    // random redovi
    for (let i = table.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [table[i], table[j]] = [table[j], table[i]];
    }

    return { table };
}


// prvi primjer - isti red zadovoljava sve kriterije
function generateDecisionTable(size, x = 5) {
    const table = [];
    const optimalAction = Math.floor(Math.random() * size); // odaberi random redak

    for (let i = 0; i < size; i++) {
        table.push([]);
        for (let j = 0; j < size; j++) {
            const value =
                i === optimalAction
                    ? Math.floor(Math.random() * (10 - x + 1) + x) // u njega stavi vrijednosti od x do 10
                    : Math.floor(Math.random() * x); // ostali redovi manje vrijednosti
            table[i].push(value);
        }
    }

    return { table, optimalAction };
}

// racunaj si, oi, lp
function calculateCriteriaRow(row, alpha = 1) {
    const si = Math.min(...row);
    const oi = Math.max(...row);
    const lp = row.reduce((sum, val) => sum + val, 0) / row.length;
    return { si, oi, lp };
}

// popuni glavnu tablicu
function populateDecisionTable(decisionTable, optimalAction, criterionData = []) {
    tableBody.innerHTML = "";

    decisionTable.forEach((rowValues, rowIndex) => {
        const row = document.createElement("tr");

        const indexCell = document.createElement("td");
        indexCell.textContent = `A${rowIndex + 1}`;
        row.appendChild(indexCell);

        rowValues.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const { si, oi, lp } = calculateCriteriaRow(rowValues);

        const siCell = document.createElement("td");
        siCell.textContent = si;
        row.appendChild(siCell);

        const oiCell = document.createElement("td");
        oiCell.textContent = oi;
        row.appendChild(oiCell);

        const alphaColumnCell = document.createElement("td");
        alphaColumnCell.textContent = (0 * si + (1 - 0) * oi).toFixed(2); // default alfa je 0
        row.appendChild(alphaColumnCell);

        const lpCell = document.createElement("td");
        lpCell.textContent = lp.toFixed(2);
        row.appendChild(lpCell);

        const criterionCell = document.createElement("td");
        criterionCell.textContent = criterionData[rowIndex] || ""; // ako ne zadovoljava niti jedan kriterij ostavi prazno ""
        row.appendChild(criterionCell);

        tableBody.appendChild(row);
    });
}

// tablica za savage
function populateLeftTable(decisionTable) {
    leftTableBody.innerHTML = "";

    const maxPerColumn = Array.from({ length: decisionTable[0].length }, (_, colIndex) =>
        Math.max(...decisionTable.map(row => row[colIndex]))
    );

    decisionTable.forEach((row, rowIndex) => {
        const newRow = document.createElement("tr");

        const indexCell = document.createElement("td");
        indexCell.textContent = `A${rowIndex + 1}`;
        newRow.appendChild(indexCell);

        const differences = row.map((val, colIndex) => maxPerColumn[colIndex] - val);
        differences.forEach(diff => {
            const cell = document.createElement("td");
            cell.textContent = diff;
            newRow.appendChild(cell);
        });

        const maxDiffCell = document.createElement("td");
        maxDiffCell.textContent = Math.max(...differences);
        newRow.appendChild(maxDiffCell);

        leftTableBody.appendChild(newRow);
    });
}

// generiraj 5x5 tablicu i popuni glavnu tablicu i savageovu za prvi primjer
function populateTablesFirst() {
    let decisionTable;
    let valid = false;

    // ako svi kriteriji nisu ispunjeni s istim redom, generiraj opet (ili ako su dva LP jednaka)
    do {
        const generated = generateDecisionTable(5);
        decisionTable = generated.table;
        valid = validateCriteriaAllEqual(decisionTable);
    } while (!valid  || checkLaplace(decisionTable) == -1);

    calculateHurwiczBorderAlphas(decisionTable);

    const optimalAction = checkWald(decisionTable);
    const criterionData = Array(5).fill("");
    criterionData[optimalAction] = "SVI";

    resetAlpha();

    populateDecisionTable(decisionTable, optimalAction, criterionData);
    populateLeftTable(decisionTable);
}

// generiraj 5x5 tablicu i popuni glavnu tablicu i savageovu za drugi primjer
function populateTablesSecond() {
    let decisionTable;
    let allDifferent = false;

    // ako svi kriteriji nisu ispunjeni s razlicitim redom, generiraj opet (ili ako su dva LP jednaka)
    do {
        const generated = generateTableSecond();
        decisionTable = generated.table;
        allDifferent = validateCriteriaAllDifferent(decisionTable);
    } while (!allDifferent || checkLaplace(decisionTable) == -1);

    calculateHurwiczBorderAlphas(decisionTable);

    const criterionData = Array(5).fill("");

    criterionData[checkWald(decisionTable)] = "Wald";
    criterionData[checkHurwicz(decisionTable)] = "Hurwicz";
    criterionData[checkSavage(decisionTable)] = "Savage";
    criterionData[checkLaplace(decisionTable)] = "Laplace";

    resetAlpha();

    populateDecisionTable(decisionTable, 0, criterionData);
    populateLeftTable(decisionTable);
}

singleButton.addEventListener("click", populateTablesFirst);
differentButton.addEventListener("click", populateTablesSecond);

function checkWald(table) {
    const minValues = table.map(row => Math.min(...row));
    return minValues.indexOf(Math.max(...minValues));
}

function checkHurwicz(table, alpha = 0) {
    const maxValues = table.map(row => Math.max(...row));
    const minValues = table.map(row => Math.min(...row));
    const hurwiczValues = maxValues.map((max, i) => (1 - alpha) * max + alpha * minValues[i]);
    
    const actionIndex = hurwiczValues.indexOf(Math.max(...hurwiczValues));

    const hurwiczSpan = document.getElementById("hurwiczAction");
    if (hurwiczSpan) {
        hurwiczSpan.textContent = actionIndex + 1;
    }
    
    return actionIndex;
}

function checkSavage(table) {
    const maxPerColumn = Array.from({ length: table[0].length }, (_, colIndex) =>
        Math.max(...table.map(row => row[colIndex]))
    );
    const regretTable = table.map(row => row.map((val, colIndex) => maxPerColumn[colIndex] - val));
    const maxRegrets = regretTable.map(row => Math.max(...row));
    return maxRegrets.indexOf(Math.min(...maxRegrets));
}

function checkLaplace(table) {
    const averages = table.map(row => {
      const sum = row.reduce((acc, val) => acc + val, 0);
      return sum / row.length;
    });
  
    const maxVal = Math.max(...averages);
  
    const indicesWithMax = averages
      .map((avg, idx) => (avg === maxVal ? idx : -1))
      .filter(idx => idx !== -1);
  
    return indicesWithMax.length === 1 ? indicesWithMax[0] : -1;
  }

function validateCriteriaAllEqual(table) {
    const wald = checkWald(table);
    const hurwicz = checkHurwicz(table);
    const savage = checkSavage(table);
    const laplace = checkLaplace(table);

    return wald === hurwicz && hurwicz === savage && savage === laplace;
}

function validateCriteriaAllDifferent(table) {
    const wald = checkWald(table);
    const hurwicz = checkHurwicz(table);
    const savage = checkSavage(table);
    const laplace = checkLaplace(table);

    return (
        wald !== hurwicz &&
        wald !== savage &&
        wald !== laplace &&
        hurwicz !== savage &&
        hurwicz !== laplace &&
        savage !== laplace
    );
}

function calculateHurwiczBorderAlphas(table) {
    const dominantRowIndex = checkHurwicz(table, 0);
    
    const alphaDependencyTbody = document.querySelector("#alphaDependencyTable tbody");
    alphaDependencyTbody.innerHTML = "";

    const dominantRow = table[dominantRowIndex];
    const minDom = Math.min(...dominantRow);
    const maxDom = Math.max(...dominantRow);

    table.forEach((row, rowIndex) => {
        if (rowIndex === dominantRowIndex) return;

        const minRow = Math.min(...row);
        const maxRow = Math.max(...row);

        const numerator = minRow - minDom;
        const denominator = (maxDom - minDom) - (maxRow - minRow);

        let borderAlpha = null;
        if (denominator !== 0) {
            borderAlpha = 1 - (numerator / denominator);
        }

        let displayAlpha = "ne postoji";

        if (borderAlpha !== null && borderAlpha >= 0 && borderAlpha <= 1) {
            displayAlpha = borderAlpha.toFixed(5);
        }

        const tr = document.createElement("tr");

        const actionCell = document.createElement("td");
        actionCell.textContent = `A${rowIndex + 1}`;
        tr.appendChild(actionCell);

        const alphaCell = document.createElement("td");
        alphaCell.textContent = displayAlpha;
        tr.appendChild(alphaCell);

        alphaDependencyTbody.appendChild(tr);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    populateTablesFirst();
});

const snowflakesContainer = document.querySelector('.snowflakes');
const numberOfSnowflakes = 50;

for (let i = 0; i < numberOfSnowflakes; i++) {
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    snowflake.textContent = '*';
    snowflake.style.left = `${Math.random() * 100}%`;
    snowflake.style.animationDelay = `${Math.random() * 10}s, ${Math.random() * 3}s`;
    snowflake.style.fontSize = `${Math.random() * 1.5 + 1}em`;
    snowflakesContainer.appendChild(snowflake);
}