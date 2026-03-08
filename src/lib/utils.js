// Utility functions for GridWise

export function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num);
}

export function formatEnergy(kwh) {
    if (kwh >= 1000) {
        return `${(kwh / 1000).toFixed(1)} MWh`;
    }
    return `${kwh.toFixed(1)} kWh`;
}

export function getStatusColor(status) {
    const colors = {
        charging: 'var(--primary)',
        completed: 'var(--info)',
        queued: 'var(--warning)',
        error: 'var(--danger)',
        idle: 'var(--text-tertiary)',
    };
    return colors[status] || 'var(--text-tertiary)';
}

export function getStatusBadgeClass(status) {
    const classes = {
        charging: 'badge-primary',
        completed: 'badge-info',
        queued: 'badge-warning',
        error: 'badge-danger',
        idle: '',
    };
    return classes[status] || '';
}

export function getPriorityBadgeClass(priority) {
    const classes = {
        high: 'badge-danger',
        medium: 'badge-warning',
        low: 'badge-info',
        express: 'badge-primary',
    };
    return classes[priority] || '';
}

export function getLoadStatus(percentage) {
    if (percentage >= 90) return { label: 'Critical', class: 'danger' };
    if (percentage >= 75) return { label: 'High', class: 'warning' };
    if (percentage >= 50) return { label: 'Moderate', class: 'info' };
    return { label: 'Normal', class: 'active' };
}

export function generateSessionId() {
    const num = Math.floor(Math.random() * 9000) + 1000;
    return `CS-${num}`;
}

export function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}
