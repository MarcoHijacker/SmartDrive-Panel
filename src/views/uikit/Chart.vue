<template>
    <div class="grid p-fluid">
        <div class="col-12">
            <div class="card">
                <h5>Select Session</h5>
                <Dropdown v-model="selectedSession" :options="sessions" optionLabel="name" optionValue="_id" placeholder="Select a Session" />
            </div>
        </div>
        <div class="col-12 xl:col-6">
            <div class="card">
                <h5>
                    <i class="pi pi-fast-forward mr-2"></i>
                    Acceleration Modulus
                </h5>
                <Chart type="line" :data="lineData" :options="lineOptions"></Chart>
            </div>
        </div>
        <div class="col-12 xl:col-6">
            <div class="card">
                <h5>
                    <i class="pi pi-step-forward mr-2"></i>
                    Speed
                </h5>
                <Chart type="line" :data="speedLineData" :options="lineOptions"></Chart>
            </div>
        </div>
        <div class="col-12 xl:col-6">
            <div class="card">
                <h5>
                    <i class="pi pi-arrows-v mr-2"></i>
                    Pitch Movements
                </h5>
                <div class="flex align-items-center justify-content-center">
                    <Chart type="bar" :data="pitchData" :options="pitchRollOptions"></Chart>
                </div>
            </div>
        </div>
        <div class="col-12 xl:col-6">
            <div class="card">
                <h5>
                    <i class="pi pi-sync mr-2"></i>
                    Roll Movements
                </h5>
                <div class="flex align-items-center justify-content-center">
                    <Chart type="bar" :data="rollData" :options="pitchRollOptions"></Chart>
                </div>
            </div>
        </div>
        <div class="col-12">
            <div class="card">
                <h5>Movement Path</h5>
                <div ref="mapElement" style="height: 500px; width: 100%;"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
            return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        } else if (index === Math.floor(totalSamples / 2) || index === totalSamples - 1) {
            return date.toLocaleTimeString();
        } else {
            return '';
        }
    });
    return labels;
};

const updateLineChart = () => {
    lineData.value = {
        labels: formatLabels(),
        datasets: [
            {
                label: 'Total Acceleration',
                data: samples.value.map(sample => sample.total_acceleration),
                pointBackgroundColor: samples.value.map(sample => {
                    switch (sample.style) {
                        case 1: return 'green';
                        case 2: return 'yellow';
                        case 3: return 'orange';
                        case 4: return 'red';
                        default: return 'blue';
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
                label: 'Speed',
                data: samples.value.map(sample => sample.speed),
                pointBackgroundColor: samples.value.map(sample => {
                    switch (sample.style) {
                        case 1: return 'green';
                        case 2: return 'yellow';
                        case 3: return 'orange';
                        case 4: return 'red';
                        default: return 'blue';
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
                    label: function(tooltipItem) {
                        const sample = samples.value[tooltipItem.dataIndex];
                        return tooltipItem.dataset.label === 'Total Acceleration'
                            ? `Total Acceleration: ${sample.total_acceleration}`
                            : `Speed: ${sample.speed}`;
                    },
                    title: function(tooltipItems) {
                        const date = new Date(samples.value[tooltipItems[0].dataIndex].created_at);
                        return tooltipItems[0].dataIndex === 0
                            ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
                            : date.toLocaleTimeString();
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
                    label: function(tooltipItem) {
                        const sample = samples.value[tooltipItem.dataIndex];
                        return tooltipItem.dataset.label === 'Pitch'
                            ? `Pitch: ${sample.pitch}`
                            : `Roll: ${sample.roll}`;
                    },
                    title: function(tooltipItems) {
                        const date = new Date(samples.value[tooltipItems[0].dataIndex].created_at);
                        return tooltipItems[0].dataIndex === 0
                            ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
                            : date.toLocaleTimeString();
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

const mapPath = ref([]);
const map = ref(null);
const mapElement = ref(null);

const updateMapPath = () => {
    mapPath.value = samples.value.map(sample => [sample.latitude, sample.longitude]);
    if (map.value) {
        const latlngs = mapPath.value;
        L.polyline(latlngs, { color: 'blue' }).addTo(map.value);
        map.value.fitBounds(L.polyline(latlngs).getBounds());
    }
};

const updatePitchRollCharts = () => {
    pitchData.value = {
        labels: formatLabels(),
        datasets: [
            {
                label: 'Pitch',
                data: samples.value.map(sample => sample.pitch),
                backgroundColor: samples.value.map(sample => {
                    switch (sample.style) {
                        case 1: return 'green';
                        case 2: return 'yellow';
                        case 3: return 'orange';
                        case 4: return 'red';
                        default: return 'blue';
                    }
                }),
                borderColor: samples.value.map(sample => {
                    switch (sample.style) {
                        case 1: return 'green';
                        case 2: return 'yellow';
                        case 3: return 'orange';
                        case 4: return 'red';
                        default: return 'blue';
                    }
                }),
                borderWidth: 2,
                fill: false,
                tension: 0.4
            }
        ]
    };

    rollData.value = {
        labels: formatLabels(),
        datasets: [
            {
                label: 'Roll',
                data: samples.value.map(sample => sample.roll),
                backgroundColor: samples.value.map(sample => {
                    switch (sample.style) {
                        case 1: return 'green';
                        case 2: return 'yellow';
                        case 3: return 'orange';
                        case 4: return 'red';
                        default: return 'blue';
                    }
                }),
                borderColor: samples.value.map(sample => {
                    switch (sample.style) {
                        case 1: return 'green';
                        case 2: return 'yellow';
                        case 3: return 'orange';
                        case 4: return 'red';
                        default: return 'blue';
                    }
                }),
                borderWidth: 2,
                fill: false,
                tension: 0.4
            }
        ]
    };
    setPitchRollChartOptions();
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
            maxZoom: 19,
        }).addTo(map.value);
    }
};
</script>

<style scoped>
/* Add your styles here */
</style>
