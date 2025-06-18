<script lang="ts">
    import type { User } from '../../stores/types';
    export let currentUser: User;
</script>

<div class="eliminated-player">
    <h2 class="text-xl font-bold text-red-600 mb-4">Tu as été éliminé !</h2>
    <p class="text-gray-600">
        Tu peux continuer à suivre la partie en tant que spectateur.
        Ton rôle était : <span class="font-semibold uppercase">{currentUser.role}</span>
    </p>
</div>
