<script lang="ts">
  import type { User } from '../../stores/types';

  export let currentUser: User;
</script>

{#if currentUser.role === 'loup-blanc'}
<div class="night-role loup-blanc">
  <h2>Phase du Loup Blanc</h2>
  <!-- Actions et affichage spécifiques au Loup Blanc -->
</div>
{/if} 