<template>
  <footer class="footer">
    <p class="footer__name">知食</p>
    <p class="footer__copy">&copy; 2026 知食</p>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--color-border);
  padding: var(--component-gap) 0;
  text-align: center;
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding-left: var(--page-padding-x);
  padding-right: var(--page-padding-x);
}

.footer__name {
  font-size: var(--font-size-body);
  color: var(--color-text-body);
}

.footer__copy {
  font-size: var(--font-size-note);
  color: var(--color-text-muted);
  margin-top: 4px;
}
</style>
