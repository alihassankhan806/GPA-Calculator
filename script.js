let reportData = {};
const gradeScale = [
  {min: 91, gp: 4.00, grade: "A"}, {min: 80, gp: 3.66, grade: "A-"},
  {min: 75, gp: 3.33, grade: "B+"}, {min: 71, gp: 3.00, grade: "B"},
  {min: 68, gp: 2.67, grade: "B-"}, {min: 64, gp: 2.33, grade: "C+"},
  {min: 61, gp: 2.00, grade: "C"}, {min: 58, gp: 1.66, grade: "C-"},
  {min: 54, gp: 1.33, grade: "D+"}, {min: 50, gp: 1.00, grade: "D"},
  {min: 0, gp: 0.00, grade: "F"}
];

// Dark Mode
function toggleTheme() {
  const body = document.documentElement;
  const btn = document.querySelector('.theme-toggle');
  if(body.getAttribute('data-theme') === 'dark') {
    body.removeAttribute('data-theme');
    btn.innerText = '🌙';
    localStorage.setItem('theme', 'light');
  } else {
    body.setAttribute('data-theme', 'dark');
    btn.innerText = '☀️';
    localStorage.setItem('theme', 'dark');
  }
}
if(localStorage.getItem('theme') === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.querySelector('.theme-toggle').innerText = '☀️';
}

function getGradeData(marks) {
  for(let g of gradeScale){ if(marks >= g.min) return g; }
  return gradeScale[gradeScale.length-1];
}
function goToStep(stepNum) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('step'+stepNum).classList.add('active');
}

function updateGrade(idx) {
  const marks = parseFloat(document.getElementById('subMarks'+idx).value);
  const gradeInput = document.getElementById('subGrade'+idx);
  const gpInput = document.getElementById('subGP'+idx);
  if(!isNaN(marks)) {
    const g = getGradeData(marks);
    gradeInput.value = g.grade;
    gpInput.value = g.gp.toFixed(2);
  } else {
    gradeInput.value = "";
    gpInput.value = "";
  }
}

function generateSubjects() {
  const name = document.getElementById('studentName').value.trim();
  const roll = document.getElementById('rollNo').value.trim();
  const sem = document.getElementById('semester').value.trim();
  const num = parseInt(document.getElementById('numSubjects').value);
  if(!name ||!roll ||!sem ||!num || num < 1) { alert("⚠️ Please fill all student details!"); return; }

  const container = document.getElementById('subjectsContainer');
  container.innerHTML = "";
  for(let i=1; i<=num; i++) {
    container.innerHTML += `
      <div class="subject-row">
        <input type="text" placeholder="Subject ${i}" id="subName${i}">
        <input type="number" placeholder="Marks" id="subMarks${i}" min="0" max="100" step="0.01" oninput="updateGrade(${i})">
        <input type="number" placeholder="Credits" id="subCredit${i}" value="3" min="0.5" step="0.5">
        <input type="text" placeholder="Grade" id="subGrade${i}" readonly>
        <input type="text" placeholder="GP" id="subGP${i}" readonly>
        <button class="btn-danger" onclick="this.parentElement.remove()">X</button>
      </div>`;
  }
  goToStep(2);
}

function calculateGPA() {
  let totalPoints = 0, totalCredits = 0, subjectData = [];
  const num = parseInt(document.getElementById('numSubjects').value);

  for(let i=1; i<=num; i++) {
    const nameEl = document.getElementById('subName'+i);
    const marksEl = document.getElementById('subMarks'+i);
    const creditsEl = document.getElementById('subCredit'+i); // FIXED: +i use kiya

    if(!nameEl ||!marksEl ||!creditsEl) continue; // agar X se delete kiya ho

    const name = nameEl.value || `Subject ${i}`;
    const marks = parseFloat(marksEl.value);
    const credits = parseFloat(creditsEl.value); // FIXED

    if(isNaN(marks) || isNaN(credits)) { alert("⚠️ Enter all marks and credits!"); return; }

    const g = getGradeData(marks);
    totalPoints += g.gp * credits;
    totalCredits += credits;
    subjectData.push([name, marks, g.grade, g.gp.toFixed(2), credits]);
  }
  if(totalCredits === 0) { alert("⚠️ Total credits cannot be zero!"); return; }

  const gpa = (totalPoints / totalCredits).toFixed(2);

  reportData = {
    name: document.getElementById('studentName').value,
    roll: document.getElementById('rollNo').value,
    semester: document.getElementById('semester').value,
    credits: totalCredits,
    gpa: gpa,
    subjects: subjectData
  };

  document.getElementById('resName').innerText = reportData.name;
  document.getElementById('resRoll').innerText = reportData.roll;
  document.getElementById('resSem').innerText = reportData.semester;
  document.getElementById('resCredits').innerText = reportData.credits;
  document.getElementById('resGPA').innerText = reportData.gpa;
  goToStep(3);
}

function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("STUDENT GPA MARKSHEET", 105, 15, {align: "center"});

  doc.setFontSize(11);
  doc.text(`Name: ${reportData.name}`, 14, 30);
  doc.text(`Roll No: ${reportData.roll}`, 14, 37);
  doc.text(`Semester: ${reportData.semester}`, 14, 44);

  doc.autoTable({
    startY: 52,
    head: [['Subject', 'Marks', 'Grade', 'GP', 'Credits']],
    body: reportData.subjects,
    theme: 'grid',
    headStyles: { fillColor: [79,70,229] },
    styles: { halign: 'center', fontSize: 9 }
  });

  let finalY = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(12);
  doc.text(`Total Credit Hours: ${reportData.credits}`, 14, finalY);
  doc.setFontSize(16);
  doc.text(`Final GPA: ${reportData.gpa} / 4.00`, 14, finalY + 10);

  //doc.setFontSize(10);
  //doc.text("Grade Scale: 91=A, 80=A-, 75=B+, 71=B, 68=B-, 64=C+, 61=C, 58=C-, 54=D+, 50=D, <50=F", 14, finalY + 20);

  doc.save(`${reportData.name}_${reportData.roll}_MarkSheet.pdf`);
}

function resetAll() {
  document.getElementById('studentName').value = "";
  document.getElementById('rollNo').value = "";
  document.getElementById('semester').value = "";
  document.getElementById('numSubjects').value = "";
  document.getElementById('subjectsContainer').innerHTML = "";
  goToStep(1);
}