<template>
  <div class="box" v-if="!isDownload && isPrepareTable">
    <div
      class="table-container shadow-sm rounded p-2 bg-white border border-success"
      :class="{ 'fixed-header': !enablePagination }"
    >
      <div class="col-12 bg-success bg-gradient rounded shadow">
        <ButtonTable />
      </div>
      <div class="table-responsive" :key="tableKey">
        <table class="table table-striped mb-0">
          <HeaderTable />
          <BodyTable />
        </table>
      </div>
    </div>

    <div class="row mt-3" v-if="enablePagination">
      <div class="col-md-4">
        <div class="dataTables_info">
          Показано с {{ currentPage * dynamicItemsPerPage + 1 }} по
          {{ Math.min((currentPage + 1) * dynamicItemsPerPage, totalItems) }} из
          {{ totalItems }} записей
        </div>
      </div>
      <div class="col-md-4">
        <nav aria-label="Page navigation">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 0 }">
              <button
                class="page-link"
                @click="goToFirstPage"
                title="Первая страница"
              >
                &laquo;
              </button>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === 0 }">
              <button class="page-link" @click="prevPage">Назад</button>
            </li>
            <li
              class="page-item"
              v-for="page in visiblePages"
              :key="page"
              :class="{ active: page === currentPage + 1 }"
            >
              <button class="page-link" @click="goToPage(page - 1)">
                {{ page }}
              </button>
            </li>
            <li
              class="page-item"
              :class="{ disabled: currentPage === pageCount - 1 }"
            >
              <button class="page-link" @click="nextPage">Вперед</button>
            </li>
            <li
              class="page-item"
              :class="{ disabled: currentPage === pageCount - 1 }"
            >
              <button
                class="page-link"
                @click="goToLastPage"
                title="Последняя страница"
              >
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
  <div class="col-12 text-center" v-else>
    <div class="spinner-border text-success" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <h5 class="mx-2">Пожалуйста, подождите...</h5>
  </div>
</template>

<script>
import { provide, ref, watch, computed, onMounted, onUnmounted } from "vue";
import HeaderTable from "./HeaderTable.vue";
import BodyTable from "./BodyTable.vue";
import ButtonTable from "./ButtonTable.vue";

export default {
  props: {
    links: {
      type: Array,
      default: () => [],
    },
    isDownload: Boolean,
    initialData: {
      type: Array,
      default: () => [],
    },
    table: {
      type: String,
      required: true,
    },
    settings: {
      type: Array,
      default: () => [],
    },
    enablePagination: {
      type: Boolean,
      default: true,
    },
    itemsPerPage: {
      type: Number,
      default: 10,
    },
    maxVisiblePages: {
      type: Number,
      default: 5,
    },
  },
  components: {
    HeaderTable,
    BodyTable,
    ButtonTable,
  },
  setup(props, { emit }) {
    const links = ref(props.links);
    const originalData = ref([]);
    const data = ref([]);
    const isPrepareTable = ref(false);
    const tableKey = ref(0);
    const windowWidth = ref(window.innerWidth);
    const changedRows = ref(new Set());
    const newRows = ref(new Set());
    const selectedRows = ref(new Set());
    provide("links", links);

    const handleRowChange = (rowId) => {
      changedRows.value.add(rowId);
    };

    const handleNewRow = (rowId) => {
      newRows.value.add(rowId);
    };

    const handleRowSelect = (rowId, isSelected) => {
      if (isSelected) {
        selectedRows.value.add(rowId);
      } else {
        selectedRows.value.delete(rowId);
      }
    };

    const getChangedData = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      const userTabId = user?.tabid;

      return {
        new: Array.from(newRows.value).map((id) =>
          originalData.value.find((row) => row.id === id)
        ),
        updated: Array.from(changedRows.value)
          .filter((id) => !newRows.value.has(id))
          .map((id) => {
            const row = originalData.value.find((row) => row.id === id);
            // Если у строки есть свойство creator_id и получен userTabId
            if (row && "creator_id" in row && userTabId !== undefined) {
              return {
                ...row,
                creator_id: userTabId,
              };
            }
            return row;
          }),
        deleted: Array.from(selectedRows.value).map((id) =>
          originalData.value.find((row) => row.id === id)
        ),
      };
    };

    const dynamicItemsPerPage = computed(() => {
      if (windowWidth.value < 576) return 2;
      if (windowWidth.value < 768) return 3;
      if (windowWidth.value < 992) return 6;
      if (windowWidth.value <= 1280) return 7;
      return 13;
    });

    const currentPage = ref(0);
    const totalItems = computed(() => data.value.length);
    const pageCount = computed(() =>
      Math.ceil(totalItems.value / dynamicItemsPerPage.value)
    );

    const visiblePages = computed(() => {
      const range = [];
      const half = Math.floor(props.maxVisiblePages / 2);
      let start = currentPage.value - half + 1 - (props.maxVisiblePages % 2);
      let end = currentPage.value + half;

      if (start <= 0) {
        start = 1;
        end = props.maxVisiblePages;
      }
      if (end > pageCount.value) {
        start = pageCount.value - (props.maxVisiblePages - 1);
        end = pageCount.value;
      }

      for (let i = start; i <= end; i++) {
        if (i > 0 && i <= pageCount.value) {
          range.push(i);
        }
      }

      return range;
    });

    const paginatedData = computed(() => {
      // Если пагинация отключена — возвращаем исходные данные (если они есть)
      if (!props.enablePagination) return data.value || [];
      // Если данных нет или это не массив — возвращаем пустой массив
      if (!data.value || !Array.isArray(data.value)) return [];
      // Если массив пуст — возвращаем его
      if (data.value.length === 0) return data.value;
      // Вычисляем пагинацию
      const start = currentPage.value * dynamicItemsPerPage.value;
      const end = start + dynamicItemsPerPage.value;
      return data.value.slice(start, end);
    });

    const updateData = (newData, isNewRow) => {
      if (isNewRow) {
        originalData.value = newData;
        currentPage.value = 0;
        tableKey.value++;
      } else {
        emit("update-data", newData);
      }
    };

    const refreshData = () => {
      changedRows.value = new Set();
      newRows.value = new Set();
      selectedRows.value = new Set();
      tableKey.value++;
      emit("refresh-data");
    };

    const saveData = () => {
      const changedData = getChangedData();
      if (changedData.new.length > 0) {
        data.value = [...data.value, ...changedData.new];
        emit("new-data", changedData.new);
      }
      if (changedData.updated.length > 0) {
        emit("update-data", changedData.updated);
      }

      changedData.new = [];
      changedData.updated = [];
      changedRows.value = new Set();
      newRows.value = new Set();
      selectedRows.value = new Set();
    };

    const deleteData = () => {
      const changedData = getChangedData();
      if (changedData.deleted.length > 0) {
        emit("delete-data", changedData.deleted);
      }
      changedData.deleted = [];
      selectedRows.value = new Set();
    };

    const goToFirstPage = () => {
      currentPage.value = 0;
      tableKey.value++;
    };

    const goToLastPage = () => {
      currentPage.value = pageCount.value - 1;
      tableKey.value++;
    };

    const nextPage = () => {
      if (currentPage.value < pageCount.value - 1) {
        currentPage.value++;
        tableKey.value++;
      }
    };

    const prevPage = () => {
      if (currentPage.value > 0) {
        currentPage.value--;
        tableKey.value++;
      }
    };

    const goToPage = (page) => {
      if (page >= 0 && page < pageCount.value) {
        currentPage.value = page;
        tableKey.value++;
      }
    };

    const handleResize = () => {
      windowWidth.value = window.innerWidth;
    };

    onMounted(async () => {
      window.addEventListener("resize", handleResize);
      try {
        isPrepareTable.value = true;
      } catch (e) {
        console.error("Initialization error:", e);
      }
    });

    onUnmounted(() => {
      window.removeEventListener("resize", handleResize);
    });

    watch(
      () => props.initialData,
      (newVal) => {
        isPrepareTable.value = false;
        originalData.value = JSON.parse(JSON.stringify(newVal));
        data.value = JSON.parse(JSON.stringify(newVal));
        isPrepareTable.value = true;
      },
      { immediate: true }
    );

    watch(
      () => props.links,
      (newLinks) => {
        links.value = newLinks;
      }
    );

    provide("originalData", originalData);
    provide("data", props.enablePagination ? paginatedData : data);
    provide(
      "settings",
      computed(() => props.settings)
    );
    provide("links", links);
    provide("updateData", updateData);
    provide("refreshData", refreshData);
    provide("saveData", saveData);
    provide("handleRowChange", handleRowChange);
    provide("handleNewRow", handleNewRow);
    provide("handleRowSelect", handleRowSelect);
    provide("getChangedData", getChangedData);
    provide("deleteData", deleteData);

    return {
      isPrepareTable,
      tableKey,
      currentPage,
      totalItems,
      pageCount,
      visiblePages,
      dynamicItemsPerPage,
      nextPage,
      prevPage,
      goToPage,
      goToFirstPage,
      goToLastPage,
    };
  },
};
</script>

<style scoped>
.box {
  width: 98%;
  margin-left: 1%;
  height: 100%;
}

.table-container {
  overflow: visible !important;
  position: relative;
  z-index: auto;
}

/* Стили для таблицы без пагинации */
.table-container.fixed-header {
  height: calc(100vh - 200px); /* Подстройте под ваш интерфейс */
  display: flex;
  flex-direction: column;
}

.table-container.fixed-header .table-responsive {
  overflow: auto;
  flex-grow: 1;
}

.table-container.fixed-header table {
  margin-bottom: 0;
}

.table-container.fixed-header thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #198754;
  color: white;
}

.table-container.fixed-header th {
  position: sticky;
  top: 0;
  background-color: #198754;
  color: white;
  z-index: 11;
}

/* Остальные стили без изменений */
.table {
  width: 100%;
  margin-bottom: 0;
  border-collapse: collapse;
}

.table td,
.table th {
  padding: 8px;
  border: 1px solid #dee2e6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table td select,
.table td input {
  width: 100%;
  box-sizing: border-box;
  border: none;
  background: transparent;
}

.table td select:focus,
.table td input:focus {
  outline: none;
  background: white;
}

.pagination {
  margin-bottom: 0;
}

.pagination .page-item.active .page-link {
  background-color: #198754;
  border-color: #198754;
  color: white;
}

.pagination .page-link {
  color: #198754;
  min-width: 40px;
  text-align: center;
}

.pagination .page-link:hover {
  color: #0d6e3f;
  background-color: #f8f9fa;
}

@media (max-width: 575.98px) {
  .table td,
  .table th {
    padding: 4px;
    font-size: 0.85rem;
  }
}
</style>