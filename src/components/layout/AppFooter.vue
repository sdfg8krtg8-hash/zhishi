<template>
  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__brand">
        <p class="footer__name">知食</p>
        <p class="footer__desc">从食材认知到烹饪入门，面向零基础小白的食材百科与家常食谱指南</p>
      </div>
      <div class="footer__links">
        <router-link to="/ingredients" class="footer__link">食材大全</router-link>
        <router-link to="/recipes" class="footer__link">食谱大全</router-link>
        <router-link to="/favorites" class="footer__link">我的收藏</router-link>
      </div>
    </div>
    <p class="footer__copy">&copy; 2026 知食 — 食材百科与家常食谱指南</p>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--color-border);
  padding: var(--section-gap) var(--page-padding-x) var(--component-gap);
  max-width: var(--page-max-width);
  margin: 0 auto;
}

.footer__inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--section-gap);
  margin-bottom: var(--component-gap);
}

.footer__brand {
  max-width: 360px;
}

.footer__name {
  font-size: var(--font-size-section);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.footer__desc {
  font-size: var(--font-size-note);
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}

.footer__links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer__link {
  font-size: var(--font-size-note);
  color: var(--color-text-body);
  transition: color 0.2s;
}

.footer__link:hover {
  color: var(--color-primary);
  text-decoration: none;
}

.footer__copy {
  font-size: var(--font-size-note);
  color: var(--color-text-muted);
  padding-top: var(--element-gap);
  border-top: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .footer__inner {
    flex-direction: column;
    gap: var(--component-gap);
  }

  .footer__links {
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--element-gap);
  }
}
</style>
