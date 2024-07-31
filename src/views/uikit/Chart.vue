<template>
    <div class="grid p-fluid">
        <div class="col-12">
            <div class="card">
                <h5>Select Session</h5>
                <Dropdown v-model="selectedSession" :options="sessions" optionLabel="name" optionValue="_id" placeholder="Select a Session" />
            </div>
        </div>
        <div class="col-12">
            <div class="card">
                <span class="mr-3 font-medium">Legend:</span>
                <span class="legend-color" style="background-color: green"></span><span class="mr-2">Prudent 😁 <span style="color: lightgray">|</span></span>
                <span class="legend-color" style="background-color: gold"></span><span class="mr-2">Normal 😊 <span style="color: lightgray">|</span></span>
                <span class="legend-color" style="background-color: orange"></span><span class="mr-2">Sporty 😐 <span style="color: lightgray">|</span></span>
                <span class="legend-color" style="background-color: red"></span><span class="mr-2">Reckless 😨</span>
            </div>
        </div>
        <div class="col-12 xl:col-6">
            <div class="card">
                <h5>
                    <i class="pi pi-fast-forward mr-2"></i>
                    Acceleration Modulus
                </h5>
                <Chart ref="accelerationChartRef" type="line" :data="lineData" :options="lineOptions"></Chart>
                <div class="grid">
                    <div class="col-6">
                        <Button label="Export CSV" icon="fas fa-file-csv mr-2" @click="exportCSV('accelerationChartRef', 'Acceleration_Modulus')" class="mt-2" />
                    </div>
                    <div class="col-6">
                        <Button label="Export PNG" icon="fas fa-file-image mr-2" @click="exportPNG('accelerationChartRef', 'Acceleration_Modulus')" class="mt-2 p-button-help" />
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 xl:col-6">
            <div class="card">
                <h5>
                    <i class="pi pi-step-forward mr-2"></i>
                    Speed
                </h5>
                <Chart ref="speedChartRef" type="line" :data="speedLineData" :options="lineOptions"></Chart>
                <div class="grid">
                    <div class="col-6">
                        <Button label="Export CSV" icon="fas fa-file-csv mr-2" @click="exportCSV('speedChartRef', 'Speed')" class="mt-2" />
                    </div>
                    <div class="col-6">
                        <Button label="Export PNG" icon="fas fa-file-image mr-2" @click="exportPNG('speedChartRef', 'Speed')" class="mt-2 p-button-help" />
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 xl:col-6">
            <div class="card" style="position: relative;">
                <h5>
                    <i class="pi pi-arrows-v mr-2"></i>
                    Pitch Movements
                </h5>
                <i class="fas fa-search-plus zoom-icon" @click="zoomChart('pitchChartRef')"></i>
                <div class="flex align-items-center justify-content-center">
                    <Chart ref="pitchChartRef" type="bar" :data="pitchData" :options="pitchRollOptions"></Chart>
                </div>
                <div class="grid">
                    <div class="col-6">
                        <Button label="Export CSV" icon="fas fa-file-csv mr-2" @click="exportCSV('pitchChartRef', 'Pitch_Movements')" class="mt-2" />
                    </div>
                    <div class="col-6">
                        <Button label="Export PNG" icon="fas fa-file-image mr-2" @click="exportPNG('pitchChartRef', 'Pitch_Movements')" class="mt-2 p-button-help" />
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 xl:col-6">
            <div class="card" style="position: relative;">
                <h5>
                    <i class="pi pi-sync mr-2"></i>
                    Roll Movements
                </h5>
                <i class="fas fa-search-plus zoom-icon" @click="zoomChart('rollChartRef')"></i>
                <div class="flex align-items-center justify-content-center">
                    <Chart ref="rollChartRef" type="bar" :data="rollData" :options="pitchRollOptions"></Chart>
                </div>
                <div class="grid">
                    <div class="col-6">
                        <Button label="Export CSV" icon="fas fa-file-csv mr-2" @click="exportCSV('rollChartRef', 'Roll_Movements')" class="mt-2" />
                    </div>
                    <div class="col-6">
                        <Button label="Export PNG" icon="fas fa-file-image mr-2" @click="exportPNG('rollChartRef', 'Roll_Movements')" class="mt-2 p-button-help" />
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12">
            <div class="card">
                <h5>Movement Path</h5>
                <div ref="mapElement" style="height: 500px; width: 100%"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import '@fortawesome/fontawesome-free/css/all.css';

const { layoutConfig } = useLayout();
let documentStyle = getComputedStyle(document.documentElement);
let textColor = documentStyle.getPropertyValue('--text-color');
let textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
let surfaceBorder = documentStyle.getPropertyValue('--surface-border');

const lineData = ref(null);
const speedLineData = ref(null);
const lineOptions = ref(null);
const pitchRollOptions = ref(null);
const sessions = ref([]);
const selectedSession = ref(null);
const samples = ref([]);
const pitchData = ref(null);
const rollData = ref(null);

const accelerationChartRef = ref(null);
const speedChartRef = ref(null);
const pitchChartRef = ref(null);
const rollChartRef = ref(null);

const token = localStorage.getItem('jwt');

const fetchSessions = async () => {
    try {
        const response = await axios.get('http://localhost:8000/session/find_by_user', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        sessions.value = response.data;
    } catch (error) {
        console.error('Error fetching sessions:', error);
    }
};

const fetchSamples = async (sessionId) => {
    try {
        const response = await axios.get(`http://localhost:8000/samples/find_by_session/${sessionId}`);
        samples.value = response.data;
        updateLineChart();
        updateSpeedLineChart();
        updateMapPath();
        updatePitchRollCharts();
    } catch (error) {
        console.error('Error fetching samples:', error);
    }
};

const formatLabels = () => {
    const labels = samples.value.map((sample, index) => {
        const date = new Date(sample.created_at);
        const totalSamples = samples.value.length;
        if (index === 0) {
            return "Samples";
        } else {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    });
    return labels;
};

const formatValue = (value) => {
    return value ? value.toFixed(4) : 'N/A';
};

const updateLineChart = () => {
    lineData.value = {
        labels: formatLabels(),
        datasets: [
            {
                label: 'Total Acceleration [m/s²]',
                data: samples.value.map((sample) => formatValue(sample.total_acceleration)),
                pointBackgroundColor: samples.value.map((sample) => {
                    switch (sample.style) {
                        case 1:
                            return 'green';
                        case 2:
                            return 'yellow';
                        case 3:
                            return 'orange';
                        case 4:
                            return 'red';
                        default:
                            return 'blue';
                    }
                }),
                borderColor: 'rgba(75, 192, 192, 1)', // Differentiated color for line
                backgroundColor: 'rgba(75, 192, 192, 0.2)', // Differentiated color for area fill
                fill: false,
                tension: 0.4
            }
        ]
    };
    setLineChartOptions();
};

const updateSpeedLineChart = () => {
    speedLineData.value = {
        labels: formatLabels(),
        datasets: [
            {
                label: 'Speed [m/s]',
                data: samples.value.map((sample) => formatValue(sample.speed)),
                pointBackgroundColor: samples.value.map((sample) => {
                    switch (sample.style) {
                        case 1:
                            return 'green';
                        case 2:
                            return 'yellow';
                        case 3:
                            return 'orange';
                        case 4:
                            return 'red';
                        default:
                            return 'blue';
                    }
                }),
                borderColor: 'rgba(153, 102, 255, 1)', // Differentiated color for line
                backgroundColor: 'rgba(153, 102, 255, 0.2)', // Differentiated color for area fill
                fill: false,
                tension: 0.4
            }
        ]
    };
    setLineChartOptions();
};

const setLineChartOptions = () => {
    lineOptions.value = {
        plugins: {
            legend: {
                labels: {
                    fontColor: textColor
                }
            },
            tooltip: {
                callbacks: {
                    label: function (tooltipItem) {
                        const sample = samples.value[tooltipItem.dataIndex];
                        const styleEmoticon = sample.style === 1 ? '😁' : sample.style === 2 ? '😊' : sample.style === 3 ? '😐' : '😨';
                        console.log(tooltipItem.dataset.label);
                        return tooltipItem.dataset.label === 'Total Acceleration [m/s²]' ? `Acceleration: ${formatValue(sample.total_acceleration)} ${styleEmoticon}` : `Speed: ${formatValue(sample.speed)} ${styleEmoticon}`;
                    },
                    title: function (tooltipItems) {
                        const date = new Date(samples.value[tooltipItems[0].dataIndex].created_at);
                        return `Date & Time: ${date.toLocaleString()}`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            }
        }
    };
};

const setPitchRollChartOptions = () => {
    pitchRollOptions.value = {
        plugins: {
            legend: {
                labels: {
                    fontColor: textColor
                }
            },
            tooltip: {
                callbacks: {
                    label: function (tooltipItem) {
                        const sample = samples.value[tooltipItem.dataIndex];
                        const styleEmoticon = sample.style === 1 ? '😁' : sample.style === 2 ? '😊' : sample.style === 3 ? '😐' : '😨';
                        return tooltipItem.dataset.label === 'Pitch [rad.]' ? `Pitch: ${formatValue(sample.pitch)} ${styleEmoticon}` : `Roll: ${formatValue(sample.roll)} ${styleEmoticon}`;
                    },
                    title: function (tooltipItems) {
                        const date = new Date(samples.value[tooltipItems[0].dataIndex].created_at);
                        return `Date & Time: ${date.toLocaleString()}`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary,
                    min: -0.01, // Adjusted min value for better zoom
                    max: 0.01 // Adjusted max value for better zoom
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            }
        }
    };
};

const mapPath = ref([]);
const map = ref(null);
const mapElement = ref(null);
const polyline = ref(null);

const updateMapPath = () => {
    mapPath.value = samples.value.map((sample) => [sample.latitude, sample.longitude]);
    if (map.value) {
        if (polyline.value) {
            map.value.removeLayer(polyline.value);
        }
        const latlngs = mapPath.value;
        polyline.value = L.polyline(latlngs, { color: 'blue' }).addTo(map.value);
        map.value.fitBounds(polyline.value.getBounds());
    }
};

const updatePitchRollCharts = () => {
    pitchData.value = {
        labels: formatLabels(),
        datasets: [
            {
                label: 'Pitch [rad.]',
                data: samples.value.map((sample) => formatValue(sample.pitch)),
                backgroundColor: samples.value.map((sample) => {
                    switch (sample.style) {
                        case 1:
                            return 'green';
                        case 2:
                            return 'yellow';
                        case 3:
                            return 'orange';
                        case 4:
                            return 'red';
                        default:
                            return 'blue';
                    }
                }),
                borderColor: samples.value.map((sample) => {
                    switch (sample.style) {
                        case 1:
                            return 'green';
                        case 2:
                            return 'yellow';
                        case 3:
                            return 'orange';
                        case 4:
                            return 'red';
                        default:
                            return 'blue';
                    }
                }),
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                stepped: true
            }
        ]
    };

    rollData.value = {
        labels: formatLabels(),
        datasets: [
            {
                label: 'Roll [rad.]',
                data: samples.value.map((sample) => formatValue(sample.roll)),
                backgroundColor: samples.value.map((sample) => {
                    switch (sample.style) {
                        case 1:
                            return 'green';
                        case 2:
                            return 'yellow';
                        case 3:
                            return 'orange';
                        case 4:
                            return 'red';
                        default:
                            return 'blue';
                    }
                }),
                borderColor: samples.value.map((sample) => {
                    switch (sample.style) {
                        case 1:
                            return 'green';
                        case 2:
                            return 'yellow';
                        case 3:
                            return 'orange';
                        case 4:
                            return 'red';
                        default:
                            return 'blue';
                    }
                }),
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                stepped: true
            }
        ]
    };
    setPitchRollChartOptions();
};

const exportCSV = (chartRefName, chartName) => {
    const chartRef = chartRefName === 'accelerationChartRef' ? accelerationChartRef.value : chartRefName === 'speedChartRef' ? speedChartRef.value : chartRefName === 'pitchChartRef' ? pitchChartRef.value : rollChartRef.value;

    if (chartRef && chartRef.chart) {
        const chartData = chartRef.chart.data;
        if (chartData && chartData.labels && chartData.datasets) {
            const csvContent = [['Sample Value', 'Sample Timestamp'], ...chartData.labels.map((label, index) => [chartData.datasets[0].data[index], samples.value[index].created_at])].map((e) => e.join(',')).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, `${chartName}_${new Date().toISOString()}.csv`);
        } else {
            console.error('Invalid chart data:', chartData);
        }
    } else {
        console.error('Invalid chart reference:', chartRef);
    }
};

const exportPNG = (chartRefName, chartName) => {
    const chartRef = chartRefName === 'accelerationChartRef' ? accelerationChartRef.value : chartRefName === 'speedChartRef' ? speedChartRef.value : chartRefName === 'pitchChartRef' ? pitchChartRef.value : rollChartRef.value;

    if (chartRef && chartRef.chart) {
        const canvas = chartRef.chart.canvas;
        if (canvas) {
            html2canvas(canvas).then((canvas) => {
                canvas.toBlob((blob) => {
                    saveAs(blob, `${chartName}_${new Date().toISOString()}.png`);
                });
            });
        }
    } else {
        console.error('Invalid chart reference:', chartRef);
    }
};

const zoomChart = (chartRefName) => {
    const chartRef = chartRefName === 'pitchChartRef' ? pitchChartRef.value : rollChartRef.value;
    const canvas = chartRef?.chart?.canvas;
    if (canvas) {
        canvas.style.width = '450px';
        chartRef.chart.resize();
    }
};

watch(selectedSession, (newSessionId) => {
    if (newSessionId) {
        fetchSamples(newSessionId);
    }
});

onMounted(() => {
    fetchSessions();
    setColorOptions();
    setLineChartOptions();
    setPitchRollChartOptions();
    initMap();
});

const setColorOptions = () => {
    documentStyle = getComputedStyle(document.documentElement);
    textColor = documentStyle.getPropertyValue('--text-color');
    textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    surfaceBorder = documentStyle.getPropertyValue('--surface-border');
};

const initMap = () => {
    if (mapElement.value) {
        map.value = L.map(mapElement.value).setView([0, 0], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(map.value);
    }
};
</script>

<style scoped>
.legend-color {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-right: 5px;
    border-radius: 50%;
}

.zoom-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    color: gray;
}
</style>