<script lang="ts">
  import { gameState } from '../../stores/gameStore';
  import { users } from '../../stores/usersStore';
  import { eliminationStore } from '../../stores/eliminationStore';
  import { activeSubTimer } from '../../stores/subTimerStore';
  import { getMajorityVictim } from '../../stores/chosen';
  import type { User } from '../../stores/types';

  export let currentUser: User;

  // Vérifier si on est dans la phase de l'Infect Père des Loups
  $: isInfectPerePhase = $activeSubTimer?.id === 'infectPereDesLoups';
  
  // Obtenir la victime sélectionnée par les loups
  $: selectedVictim = getMajorityVictim();
  $: victim = selectedVictim ? $users.find(u => u.login === selectedVictim) : null;

  // Fonction pour infecter la victime
  function infectVictim() {
    if (!victim) return;
    
    // Mettre à jour le rôle de la victime en Loup-garou
    users.update(usersList =>
      usersList.map(user => {
        if (user.login === victim.login) {
          return { ...user, role: 'Loup-garou' };
        }
        return user;
      })
    );
  }
</script>

{#if currentUser.role === 'Infect Père des loups' && isInfectPerePhase}
<div class="night-role infect-pere">
  <h2>Phase de l'Infect Père des Loups</h2>
  
  {#if victim}
    <div class="victim-info">
      <p>Les loups ont choisi : {victim.firstName} {victim.lastName || ''}</p>
      <button on:click={infectVictim}>
        Infecter ce joueur
      </button>
    </div>
  {:else}
    <p>Aucune victime n'a été sélectionnée par les loups.</p>
  {/if}
</div>
{/if}

<style>
  .night-role {
    padding: 1rem;
    border-radius: 8px;
    background-color: var(--primary);
    color: var(--text);
  }

  .victim-info {
    margin-top: 1rem;
    text-align: center;
  }

  button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    background-color: var(--danger);
    color: white;
    border: none;
    cursor: pointer;
  }

  button:hover {
    opacity: 0.9;
  }
</style>
