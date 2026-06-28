const fs = require('fs');

const path = 'E:/ZeroMomentum AI/frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const w1Marker = '{/* Widget 1: Deep Focus Meter (Full Width Cinematic Box) */}';
const w2Marker = '{/* Bottom Widgets Row */}';
const w3Marker = '{/* Bottom Data Table: Critical Deadlines Log */}';

const w1Index = content.indexOf(w1Marker);
const w2Index = content.indexOf(w2Marker);
const w3Index = content.indexOf(w3Marker);

let beforeWidgets = content.substring(0, w1Index);
let widget1 = content.substring(w1Index, w2Index);
let widget23 = content.substring(w2Index, w3Index - 4); // Include the closing div and newline
let afterWidgets = content.substring(w3Index - 4);

// Change the flex flex-col back to grid grid-cols-1 lg:grid-cols-2
widget23 = widget23.replace(
  '<div className="flex flex-col gap-8">',
  '      {/* Top Widgets Row */}\n      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">'
);

// We need to reorder so it's beforeWidgets -> widget23 -> widget1 -> afterWidgets
const newContent = beforeWidgets + widget23 + '\n' + widget1 + afterWidgets;

fs.writeFileSync(path, newContent);
console.log('Successfully reordered widgets!');
