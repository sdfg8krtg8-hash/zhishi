<template>
  <div class="banner">
    <div class="banner__inner">
      <svg class="banner__decor" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2v0a5 5 0 0 0-5 5v1c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
      <h1 class="banner__title">知食</h1>
      <p class="banner__tagline">从食材认知到烹饪入门</p>
      <p class="banner__subtitle">面向零基础小白的食材百科与家常食谱指南</p>
    </div>
  </div>
</template>

<style scoped>
.banner {
  padding: 48px 24px;
  padding-top: calc(var(--navbar-height) + 48px);
  background: var(--color-card-bg);
  text-align: center;
}

.banner__inner {
  max-width: var(--page-max-width);
  margin: 0 auto;
}

.banner__decor {
  color: var(--color-primary-light);
  margin-bottom: 16px;
}

.banner__title {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-text-title);
  margin-bottom: 8px;
}

.banner__tagline {
  font-size: 16px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.banner__subtitle {
  font-size: 14px;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .banner {
    padding: 32px 16px;
    padding-top: calc(var(--navbar-height) + 32px);
  }

  .banner__title {
    font-size: 28px;
  }

  .banner__tagline {
    font-size: 14px;
  }

  .banner__subtitle {
    font-size: 13px;
  }
}
</style>
