// Shared logic for ByCashVault
document.addEventListener('DOMContentLoaded', async () => {
    const authButtons = document.getElementById('auth-buttons');
    if (authButtons) {
        try {
            const res = await fetch('/api/user');
            if (res.ok) {
                const user = await res.json();
                authButtons.innerHTML = `
                    <div class="flex items-center gap-4">
                        <span class="text-sm font-bold text-amber-500">$${user.balance.toLocaleString()}</span>
                        <a href="/dashboard.html" class="btn-primary text-sm">Dashboard</a>
                    </div>
                `;
            }
        } catch (e) {
            console.log('Not logged in');
        }
    }
});
