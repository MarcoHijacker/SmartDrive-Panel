<template>
    <div class="grid">
        <!-- User Statistics (AVG values) -->
        <div class="col-12">
            <div class="card">
                <h5>
                    <i class="pi pi-user mr-2"></i>
                    <span>Global User Statistics</span>
                </h5>
                <DataTable :value="userStatistics" responsiveLayout="scroll">
                    <Column field="average_style" header="Style Avg." :sortable="true">
                        <template #body="slotProps">
                            <span :style="{ color: getStyleColor(slotProps.data.average_style), fontWeight: 'bold' }">
                                {{ formatValue(slotProps.data.average_style) }}
                            </span>
                        </template>
                    </Column>
                    <Column field="average_speed" header="Speed Avg. (m/s)" :sortable="true">
                        <template #body="slotProps">
                            {{ formatValue(slotProps.data.average_speed) }}
                        </template>
                    </Column>
                    <Column field="average_acceleration" header="Acceleration Avg. (m/s²)" :sortable="true">
                        <template #body="slotProps">
                            {{ formatValue(slotProps.data.average_acceleration) }}
                        </template>
                    </Column>
                    <Column field="max_speed" header="Max Speed (m/s)" :sortable="true">
                        <template #body="slotProps">
                            {{ formatValue(slotProps.data.max_speed) }}
                        </template>
                    </Column>
                    <Column field="max_acceleration" header="Max Acceleration (m/s²)" :sortable="true">
                        <template #body="slotProps">
                            {{ formatValue(slotProps.data.max_acceleration) }}
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
        <!-- Average Style per Session -->
        <div class="col-12 xl:col-6">
            <div class="card">
                <h5>
                    <i class="pi pi-chart-bar mr-2"></i>
                    <span>Avg. Style per Session</span>
                </h5>
                <Chart type="bar" :data="sessionStyleChartData" :options="lineOptions" />
            </div>
        </div>
        <!-- Average Total Acceleration per Session -->
        <div class="col-12 xl:col-6">
            <div class="card">
                <h5>
                    <i class="pi pi-chart-bar mr-2"></i>
                    <span>Avg. Acceleration per Session</span>
                </h5>
                <Chart type="bar" :data="sessionAccelerationChartData" :options="lineOptions" />
            </div>
        </div>
    </div>
</template>

<script setup>
import Menu from 'primevue/menu';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Chart from 'primevue/chart';
import { ref, onMounted } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import axios from 'axios';

const { isDarkTheme } = useLayout();

const userStatistics = ref([]);
const sessions = ref([]);
const sessionStyleChartData = ref(null);
const sessionAccelerationChartData = ref(null);
const lineOptions = ref(null);

const token = localStorage.getItem('jwt');

const fetchSessions = async () => {
    try {
        const response = await axios.get('http://localhost:8000/session/find_by_user', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        sessions.value = response.data;
        console.log('Sessions:', sessions.value);
        updateSessionCharts();
    } catch (error) {
        console.error('Error fetching sessions:', error);
    }
};

const fetchUserStatistics = async () => {
    try {
        const globalStatsResponse = await axios.get('http://localhost:8000/user/get_global_statistics', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const styleAvgResponse = await axios.get('http://localhost:8000/user/style_average', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const combinedStatistics = {
            ...globalStatsResponse.data,
            average_style: styleAvgResponse.data.style_average
        };

        userStatistics.value = [combinedStatistics]; // Ensure it's an array
        console.log('User Statistics:', userStatistics.value);
    } catch (error) {
        console.error('Error fetching user statistics:', error);
    }
};

const updateSessionCharts = async () => {
    const styleData = [];
    const accelerationData = [];
    const sessionLabels = [];
    const styleBackgroundColors = [];

    for (const session of sessions.value) {
        try {
            const response = await axios.get(`http://localhost:8000/samples/find_by_session/${session._id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const samples = response.data;
            const averageStyle = samples.reduce((acc, sample) => acc + sample.style, 0) / samples.length;
            const averageAcceleration = samples.reduce((acc, sample) => acc + sample.total_acceleration, 0) / samples.length;

            styleData.push(averageStyle);
            accelerationData.push(averageAcceleration);
            sessionLabels.push(session.name);
            styleBackgroundColors.push(getStyleColor(averageStyle)); // Set the background color based on the average style
        } catch (error) {
            console.error(`Error fetching samples for session ${session._id}:`, error);
        }
    }

    sessionStyleChartData.value = {
        labels: sessionLabels,
        datasets: [
            {
                label: 'Average Style',
                data: styleData,
                backgroundColor: styleBackgroundColors,
                borderColor: '#1E88E5',
                fill: false,
                tension: 0.4
            }
        ]
    };

    sessionAccelerationChartData.value = {
        labels: sessionLabels,
        datasets: [
            {
                label: 'Average Acceleration',
                data: accelerationData,
                backgroundColor: '#42A5F5', // Changed to blue
                borderColor: '#1E88E5', // Changed to blue
                fill: false,
                tension: 0.4
            }
        ]
    };

    console.log('Updated Charts:', sessionStyleChartData.value, sessionAccelerationChartData.value);
    setChartOptions();
};

const setChartOptions = () => {
    lineOptions.value = {
        plugins: {
            legend: {
                labels: {
                    color: isDarkTheme.value ? '#ebedef' : '#495057'
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: isDarkTheme.value ? '#ebedef' : '#495057'
                },
                grid: {
                    color: isDarkTheme.value ? 'rgba(160, 167, 181, .3)' : '#ebedef'
                }
            },
            y: {
                ticks: {
                    color: isDarkTheme.value ? '#ebedef' : '#495057'
                },
                grid: {
                    color: isDarkTheme.value ? 'rgba(160, 167, 181, .3)' : '#ebedef'
                }
            }
        }
    };
};

const formatValue = (value) => {
    return value ? value.toFixed(3) : 'N/A';
};

const getStyleColor = (value) => {
    if (value < 1.5) {
        return 'green';
    } else if (value < 2.4) {
        return 'rgb(231, 203, 57)';
    } else if (value < 3.4) {
        return 'darkorange';
    } else {
        return 'red';
    }
};

onMounted(() => {
    fetchSessions();
    fetchUserStatistics();
    setChartOptions();
});
</script>

<style scoped>
/* Add your styles here */
</style>