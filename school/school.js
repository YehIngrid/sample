const mainContent = document.getElementById('mainContent');
const startCreate = document.getElementById('stareCreate');
const createbtn = document.getElementById('createbtn');
createbtn.addEventListener('click', function(e) {
    mainContent.style.display = "none";
    startCreate.style.display = "block";
})
new FinisherHeader({
  "count": 12,
  "size": {
    "min": 1300,
    "max": 1500,
    "pulse": 0
  },
  "speed": {
    "x": {
      "min": 0.6,
      "max": 3
    },
    "y": {
      "min": 0.6,
      "max": 3
    }
  },
  "colors": {
    "background": "#826cff",
    "particles": [
      "#ff884d",
      "#90b6ff",
      "#3d40fc",
      "#0362ff",
      "#ffffff"
    ]
  },
  "blending": "lighten",
  "opacity": {
    "center": 0.6,
    "edge": 0
  },
  "skew": -2,
  "shapes": [
    "c"
  ]
});