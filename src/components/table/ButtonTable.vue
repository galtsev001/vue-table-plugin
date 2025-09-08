<template>
  <div class="col-12 m-1 d-flex flex-wrap gap-2">
    <button class="btn btn-sm btn-success" @click="addNewRow">
      <i class="bi bi-plus-circle-fill"></i> Новая строка
    </button>
    <button class="btn btn-sm btn-success" @click="refreshTable()">
      <i class="bi bi-arrow-clockwise"></i> Обновить
    </button>
    <button
      class="btn btn-sm btn-success"
      @click="saveChanges()"
      v-if="hasChanges"
    >
      <i class="bi bi-floppy2-fill"></i> Сохранить
    </button>
    <button class="btn btn-sm btn-success" @click="exportToExcel">
      <i class="bi bi-file-earmark-excel-fill"></i> Экспорт
    </button>
    <button
      class="btn btn-sm btn-danger"
      @click="deleteDataTable"
      v-if="hasSelectedRows"
    >
      <i class="bi bi-trash-fill"></i> Удалить
    </button>
  </div>
</template>

<script>
import { inject, computed } from "vue";
import * as XLSX from "xlsx";
import moment from "moment";

export default {
  setup() {
    const originalData = inject("originalData");
    const data = inject("data");
    const updateData = inject("updateData");
    const refreshData = inject("refreshData");
    const saveData = inject("saveData");
    const deleteData = inject("deleteData");
    const settings = inject("settings");
    const links = inject("links");
    const getChangedData = inject("getChangedData");

    const hasChanges = computed(() => {
      const changedData = getChangedData();
      return changedData.new.length > 0 || changedData.updated.length > 0;
    });

    const hasSelectedRows = computed(() => {
      const changedData = getChangedData();
      return changedData.deleted.length > 0;
    });

    const refreshTable = async () => {
      refreshData();
      await new Promise((resolve) => setTimeout(resolve, 50)); // небольшая задержка
    };

    const saveChanges = () => {
      saveData();
    };

    const deleteDataTable = () => {
      deleteData();
    };

    const exportToExcel = () => {
      if (!data.value?.length) {
        console.error("Нет данных для экспорта");
        return;
      }

      try {
        const headers = settings.value.map((x) => x.name_column);
        const rows = prepareReportData();

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, "report.xlsx");
      } catch (error) {
        console.error("Ошибка при экспорте:", error);
      }
    };

    const prepareReportData = () => {
      return originalData.value.map((item) => {
        return settings.value.map((setting) => {
          const columnName = setting.name_column_db;
          if (isLinkedColumn(columnName)) {
            const link = links.value.find((x) => x.link_column === columnName);
            return link?.value[item[columnName]] || item[columnName];
          }
          return item[columnName];
        });
      });
    };

    const isLinkedColumn = (columnName) => {
      return links.value?.some((link) => link.link_column === columnName);
    };

    const addNewRow = () => {
      if (!originalData.value.length) return;

      const newRow = createEmptyRow();
      updateData([newRow, ...originalData.value], true);
    };

    const createEmptyRow = () => {
      const newRow = {};
      const timestamp = moment(new Date()).format("YYYY-MM-DDTHH:mm");

      Object.keys(data.value[0]).forEach((key) => {
        switch (key) {
          case "id":
            newRow[key] = generateNewId();
            break;
          case "creation_date":
            newRow[key] = timestamp;
            break;
          case "creator_id":
            newRow[key] = JSON.parse(localStorage.getItem('user')).tabid; // или ID текущего пользователя
            break;
          default:
            newRow[key] = getDefaultValue(key);
        }
      });

      return newRow;
    };

    const getDefaultValue = (key) => {
      const type = settings.value.find(
        (x) => x.name_column_db === key
      ).type_data;
      switch (type) {
        case "int":
          return 0;
        case "DateTime":
          return moment(new Date()).format("YYYY-MM-DD HH:mm");
        default:
          return "";
      }
    };

    const generateNewId = () => {
      const maxId = Math.max(...originalData.value.map((x) => x.id || 0), 0);
      return maxId + 1;
    };

    return {
      deleteDataTable,
      saveChanges,
      hasChanges,
      hasSelectedRows,
      addNewRow,
      refreshTable,
      exportToExcel,
    };
  },
};
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>