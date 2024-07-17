<template>
  <div class="grid p-fluid">
    <!-- Add Session Form -->
    <div class="col-12">
      <div class="card">
        <h5>
          <i class="pi pi-plus-circle mr-2"></i>
          <span>Create New Session</span>
        </h5>
        <div class="grid formgrid">
          <div class="col-12 lg:col-8 mb-2">
            <InputText id="sessionName" v-model="sessionName" placeholder="Session Name" />
            <small v-if="formSubmitted && !sessionName" class="p-error"><b>Session Name</b> is required</small>
          </div>
          <div class="col-12 lg:col-4 mb-5 flex align-items-center">
            <Button label="Create Session" icon="pi pi-check" @click="createSession" />
            <Button icon="pi pi-eraser" class="ml-2 p-button-secondary" @click="resetForm" />
          </div>
        </div>
      </div>
    </div>

    <!-- Session List Table -->
    <div class="col-12">
      <div class="card">
        <h5>
          <i class="pi pi-table mr-2"></i>
          <span>All Sessions</span>
        </h5>
        <div class="grid formgrid">
          <div class="col-12 lg:col-3 mb-2">
            <InputText placeholder="Search by Name" v-model="searchQuery" @input="searchSessions" />
          </div>
          <div class="col-12 lg:col-3 mb-2">
            <Dropdown
              v-model="statusFilter"
              :options="[{ label: 'All', value: null }, { label: 'Active', value: 1 }, { label: 'Inactive', value: 2 }]"
              optionLabel="label"
              optionValue="value"
              placeholder="Filter by Status"
              @change="filterAndSortSessions"
            />
          </div>
          <div class="col-12 lg:col-3 mb-2 flex align-items-center">
            <span class="mr-2">Sort by date: </span>
            <Button icon="pi" :class="sortOrderIcon" @click="toggleSortOrder" />
          </div>
          <div class="col-12 lg:col-3 mb-2 flex align-items-center justify-content-end">
            <Button icon="pi pi-eraser" class="p-button-secondary" @click="resetFilters" />
          </div>
        </div>
        <DataTable :value="paginatedSessions" responsiveLayout="scroll" class="mt-4" :paginator="true" :rows="10" :totalRecords="filteredSessions.length" @page="onPageChange">
          <Column field="name" header="Name"></Column>
          <Column field="status" header="Status">
            <template #body="slotProps">
              <i
                v-if="slotProps.data.status === 1"
                class="pi pi-check"
                style="color: green"
              ></i>
              <i
                v-else-if="slotProps.data.status === 2"
                class="pi pi-lock"
                style="color: brown"
              ></i>
              <i
                v-else
                class="pi pi-question-circle"
                style="color: grey"
              ></i>
            </template>
          </Column>
          <Column field="created_at" header="Creation Date">
            <template #body="slotProps">
              {{ slotProps.data.created_at }}
            </template>
          </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-info mr-2"
                @click="editSession(slotProps.data)"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-danger mr-2"
                @click="confirmDeleteSession(slotProps.data._id)"
              />
              <Button
                icon="pi pi-check"
                :class="['p-button-rounded mr-2', slotProps.data.status === 1 ? 'p-button-success' : 'p-button-secondary']"
                @click="toggleSessionStatus(slotProps.data, 1)"
              />
              <Button
                icon="pi pi-times"
                :class="['p-button-rounded', slotProps.data.status === 2 ? 'p-button-help' : 'p-button-secondary']"
                @click="toggleSessionStatus(slotProps.data, 2)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Edit Session Modal -->
    <Dialog header="Edit Session" v-model:visible="editingSessionVisible" @hide="closeEditModal">
      <div class="grid formgrid">
        <div class="col-12 lg:col-5 mb-2">
          <InputText id="editSessionName" v-model="editingSession.name" placeholder="Session Name" />
        </div>
        <div class="col-12 lg:col-3 mb-2 me-2">
          <Dropdown
            id="editSessionStatus"
            v-model="editingSession.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select Status"
            disabled
          />
        </div>
        <div class="col-12 lg:col-4 mb-2">
          <Button label="Update Session" class="p-button-info" icon="pi pi-check" @click="updateSession" />
        </div>
      </div>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { SessionService } from '../services/SessionService';
import { calculateStyleAverage } from '../services/StyleAverageService';

// Refs for session fields and lists
const sessionName = ref('');
const sessions = ref([]);
const filteredSessions = ref([]);
const paginatedSessions = ref([]);
const editingSession = ref(null);
const editingSessionVisible = ref(false);
const styleAverage = ref(null);
const formSubmitted = ref(false);
const statusFilter = ref(null);
const sortOrder = ref('asc');
const sortOrderIcon = ref('pi pi-sort-amount-up');
const statusOptions = ref([
  { label: 'Active', value: 1 },
  { label: 'Inactive', value: 2 }
]);
const searchQuery = ref(''); // Added ref for search query
const currentPage = ref(0); // Added ref for current page

const toast = useToast();
const confirmPopup = useConfirm();
const sessionService = new SessionService();

// Load all sessions by user on component mount
onMounted(() => {
  fetchSessions();
});

// Fetch all sessions by user
const fetchSessions = async () => {
  try {
    const response = await sessionService.getSessionsByUser();
    sessions.value = response.data;
    filterAndSortSessions();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch sessions', life: 3000 });
  }
};

// Create a new session
const createSession = async () => {
  formSubmitted.value = true;
  if (sessionName.value.trim() === '') {
    toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please provide all required fields', life: 3000 });
    return;
  }
  const newSession = {
    name: sessionName.value,
    status: null, // Default status is null
    created_at: new Date().toISOString(),
  };
  try {
    await sessionService.createSession(newSession);
    fetchSessions();
    resetForm();
    toast.add({ severity: 'success', summary: 'Success', detail: 'Session created', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create session', life: 3000 });
  }
};

// Edit session
const editSession = (session) => {
  editingSession.value = { ...session };
  editingSessionVisible.value = true;
};

// Update session
const updateSession = async () => {
  try {
    await sessionService.updateSession(editingSession.value._id, {
      name: editingSession.value.name,
      status: editingSession.value.status, // Save correct status
    });
    fetchSessions();
    editingSession.value = null;
    editingSessionVisible.value = false;
    toast.add({ severity: 'info', summary: 'Updated', detail: 'Session updated', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update session', life: 3000 });
  }
};

// Close edit modal
const closeEditModal = () => {
  editingSession.value = null;
  editingSessionVisible.value = false;
};

// Confirm delete session
const confirmDeleteSession = (sessionId) => {
  confirmPopup.require({
    message: 'Are you sure you want to delete this session?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteSession(sessionId)
  });
};

// Delete session with confirmation
const deleteSession = async (sessionId) => {
  try {
    await sessionService.deleteSession(sessionId);
    fetchSessions();
    toast.add({ severity: 'error', summary: 'Deleted', detail: 'Session deleted', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete session', life: 3000 });
  }
};

// Activate or deactivate session
const toggleSessionStatus = async (session, newStatus) => {
  try {
    if (newStatus === 1) {
      await sessionService.activateSession(session._id);
      toast.add({ severity: 'success', summary: 'Success', detail: 'Session activated', life: 3000 });
    } else if (newStatus === 2) {
      await sessionService.deactivateSession(session._id);
      toast.add({ severity: 'secondary', summary: 'Success', detail: 'Session deactivated', life: 3000 });
    }
    fetchSessions();
  } catch (error) {
    if (error.response.status === 409) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Only one session can be active', life: 3000 });
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update session status', life: 3000 });
    }
  }
};

// Search sessions
const searchSessions = (event) => {
  searchQuery.value = event.target.value; // Update search query
  filterAndSortSessions();
};

// Toggle sort order
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  sortOrderIcon.value = sortOrder.value === 'asc' ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down';
  filterAndSortSessions();
};

// Filter and sort sessions
const filterAndSortSessions = () => {
  let filtered = sessions.value.filter(session =>
    session.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
  if (statusFilter.value !== null) {
    filtered = filtered.filter(session => session.status === statusFilter.value);
  }
  if (sortOrder.value === 'asc') {
    filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  filteredSessions.value = filtered;
  paginateSessions();
};

// Paginate sessions
const paginateSessions = () => {
  const start = currentPage.value * 10;
  const end = start + 10;
  paginatedSessions.value = filteredSessions.value.slice(start, end);
};

// Handle page change
const onPageChange = (event) => {
  currentPage.value = event.page;
  paginateSessions();
};

// Watch for changes in the session list and filters
watch([sessions, statusFilter, sortOrder, searchQuery, currentPage], filterAndSortSessions);

// Reset form fields
const resetForm = () => {
  sessionName.value = '';
  formSubmitted.value = false;
};

// Reset table filters
const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = null;
  filterAndSortSessions();
};

// Calculate style average for a session
const getStyleAverage = async (sessionId) => {
  styleAverage.value = await calculateStyleAverage(sessionId);
};
</script>

<style scoped>
.p-error {
  color: red;
}
</style>