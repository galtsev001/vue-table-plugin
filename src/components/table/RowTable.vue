<template>
  <tr>
    <td>
      <input 
        type="checkbox" 
        @change="handleCheckboxChange($event, row.id)" 
      />
    </td>
    <Cell 
      v-for="(cell, index) in row" 
      :key="index" 
      :id="index" 
      :cell="cell" 
      :rowId="row.id"
    />
  </tr>
</template>

<script>
import CellTable from "./CellTable.vue";
import { inject } from "vue";

export default {
  props: ["row"],
  setup() {
    const handleRowSelect = inject("handleRowSelect");
    
    const handleCheckboxChange = (event, rowId) => {
      handleRowSelect(rowId, event.target.checked);
    };
    
    return {
      handleCheckboxChange
    };
  },
  components: {
    Cell: CellTable,
  },
};
</script>

<style  scoped>
</style>