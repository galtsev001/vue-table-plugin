<template>
  <thead class="table-success sticky-top">
    <tr>
      <th style="width: 10px">#</th>
      <th
        v-for="(column, index) in getHeader"
        :key="index"
        :style="getColumnStyle(column.name_column_db)"
        :ref="(el) => setColumnRef(el, column.name_column_db)"
      >
        <div class="d-flex justify-content-between align-items-center filter-header">
          <span>{{ column.name_column }}</span>
          <button
            class="btn btn-sm filter-button"
            @click.stop="toggleFilter(column.name_column_db, $event)"
          >
            <i class="bi bi-three-dots-vertical"></i>
          </button>
        </div>
      </th>
    </tr>
  </thead>
  <FilterTable
    v-if="activeFilter"
    :position="filterPosition"
    :column-id="activeFilter"
    @close="closeFilter"
  />
</template>

<script>
import { inject, ref, onMounted, onUnmounted, computed, watch } from "vue";
import FilterTable from "./FilterTable.vue";

export default {
  components: {
    FilterTable,
  },
  setup() {
    const settings = inject("settings");
    const links = inject("links");
    const data = inject("data");
    const activeFilter = ref(null);
    const filterPosition = ref({ top: 0, left: 0, width: 200 });
    const columnElements = ref({});
    const columnWidths = ref({});

    // Добавлено глубокое отслеживание data
    watch(
      [() => settings.value, () => links.value, () => data.value],
      () => {
        columnWidths.value = calculateColumnWidths();
      },
      { deep: true }
    );

    const getHeader = computed(() => {
      return [...settings.value].sort((a, b) => a.column_order - b.column_order);
    });

    const shouldShowSelect = (columnId) => {
      const result = links.value?.some(link => link.link_column === columnId) ?? false;
      return result;
    };

    const selectOptions = (columnId) => {
      const link = links.value?.find(link => link.link_column === columnId);
      return link?.value;
    };

    const getColumnsData = (columnId) => {
      const columnData = data.value?.map(x => x[columnId]) || [];
      return columnData;
    };

    const calculateColumnWidths = () => {
      const newWidths = {};
      
      if (!settings.value) return newWidths;

      settings.value.forEach((column) => {
        const columnId = column.name_column_db;
        let maxLength = column.name_column?.toString().length || 0;
        if (shouldShowSelect(columnId)) {
          const options = selectOptions(columnId);
          
          if (options === undefined) {
            const list = getColumnsData(columnId);
            maxLength = Math.max(
              maxLength,
              ...list.map(item => item?.toString().length || 0)
            );
          } else if (Object.keys(options).length === 0) {
            const list = getColumnsData(columnId);
            maxLength = Math.max(
              maxLength,
              ...list.map(item => item?.toString().length || 0)
            );
          } else {
            maxLength = Math.max(
              maxLength,
              ...Object.values(options).map(opt => opt?.toString().length || 0)
            );
          }
        } else {
          // Для колонок без выпадающего списка используем данные столбца
          const list = getColumnsData(columnId);
          maxLength = Math.max(
            maxLength,
            ...list.map(item => item?.toString().length || 0)
          );
        }

        newWidths[columnId] = Math.min(Math.max((maxLength + 3) * 8, 100), 500);
      });

      return newWidths;
    };

    const setColumnRef = (el, columnId) => {
      if (el) columnElements.value[columnId] = el;
    };

    const updateFilterPosition = () => {
      if (!activeFilter.value) return;
      const columnElement = columnElements.value[activeFilter.value];
      if (columnElement) {
        const rect = columnElement.getBoundingClientRect();
        filterPosition.value = {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: Math.max(rect.width, 250),
        };
      }
    };

    const toggleFilter = (columnId, event) => {
      activeFilter.value = activeFilter.value === columnId ? null : columnId;
      if (activeFilter.value) {
        updateFilterPosition();
      }
      event.stopPropagation();
    };

    const closeFilter = () => {
      activeFilter.value = null;
    };

    const handleScroll = () => {
      if (activeFilter.value) {
        updateFilterPosition();
      }
    };

    const handleClickOutside = (event) => {
      if (!activeFilter.value) return;
      const filterBox = document.querySelector(".filter-box");
      const clickedOutside = filterBox && !filterBox.contains(event.target);
      const clickedOnFilterButton = event.target.closest(".filter-button");

      if (clickedOutside && !clickedOnFilterButton) {
        closeFilter();
      }
    };

    onMounted(() => {
      columnWidths.value = calculateColumnWidths();
      document.addEventListener("click", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", updateFilterPosition);
    });

    onUnmounted(() => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updateFilterPosition);
    });

    const getColumnStyle = (columnId) => ({
      width: `${columnWidths.value[columnId] || 150}px`,
      minWidth: `${columnWidths.value[columnId] || 150}px`,
      maxWidth: "500px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      position: "relative",
    });

    return {
      getHeader,
      activeFilter,
      filterPosition,
      toggleFilter,
      closeFilter,
      setColumnRef,
      getColumnStyle,
    };
  },
};
</script>

<style scoped>
th {
  transition: width 0.3s ease;
}
</style>