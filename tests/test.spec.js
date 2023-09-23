const { test, expect } = require('@playwright/test');
const { chromium } = require('playwright');

test('Validation de la communication front-end et back-end', async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('https://www.welcometothejungle.com/fr/me/settings/account');

  await testSuccessfulLogin(page);

  await testLoginFailureMissingEmailandPassword(page);

  await testLoginFailureInvalidEmail(page);

  await testLoginFailureIncorrectPassword(page);

  await testSuccessfulUploadPhoto(page);

  await testVerifyAuthenticationBeforeUpload(page);

  await testServerErrorDuringUpload(page);

  await testUploadFailureInvalidFileFormat(page);

  await browser.close();
});

async function testSuccessfulLogin(page) {
  try{
    await page.goto('https://www.welcometothejungle.com/fr/signin');
    await page.click('button[data-testid="session-tab-login"]');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', process.env.LOGIN);
    await page.fill('input[name="password"]', process.env.PASSWORD);
    await page.click('button[data-testid="login-button-submit"]');
    await page.waitforNavigation();
    await page.waitForSelector('Connexion réussite : Bienvenue !', { visible: true })
    await expect(page.url()).toContain('https://www.welcometothejungle.com/fr/me/settings/account');
  } catch (error) {
    console.error('Une erreur s\'est produite :', error);
  }
}

async function testLoginFailureMissingEmailandPassword(page) {
  try {
    await page.goto('https://www.welcometothejungle.com/fr/signin');
    await page.click('button[data-testid="login-button-submit"]');
    await expect(page.locator('text=Champ requis')).toBeVisible();
    await expect(page.locator('text=Doit contenir au minimum 8 caractères')).toBeVisible();
  } catch (error) {
    console.error('Une erreur s\'est produite :', error);
  }
}  

async function testLoginFailureInvalidEmail(page) {
  try {
    await page.goto('https://www.welcometothejungle.com/fr/signin');
    await page.click('button[data-testid="session-tab-login"]');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', 'email_invalide');
    await page.fill('input[name="password"]', process.env.PASSWORD);
    await page.click('button[data-testid="login-button-submit"]');
    await expect(page.locator("text=Email ou mot de passe incorrect")).toBeVisible();
    const isErrorMessageVisible = await page.isVisible('text=Email ou mot de passe incorrect');
    if (isErrorMessageVisible) {
      console.log('Test réussi : Échec de la connexion en raison d\'un mail incorrect.');
    } else {
      console.error('Test échoué : Le message d\'erreur n\'a pas été affiché.');
    }
  } catch (error) {
    console.error('Une erreur s\'est produite :', error);
  }
}

async function testLoginFailureIncorrectPassword(page) {
  try {
    await page.goto('https://www.welcometothejungle.com/fr/signin');
    await page.click('button[data-testid="session-tab-login"]');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', process.env.LOGIN);
    await page.fill('input[name="password"]', 'mot_de_passe_incorrect');
    await page.click('button[data-testid="login-button-submit"]');
    await expect(page.locator("text=Email ou mot de passe incorrect")).toBeVisible();
    const isErrorMessageVisible = await page.isVisible('text=Email ou mot de passe incorrect');
    if (isErrorMessageVisible) {
      console.log('Test réussi : Échec de la connexion en raison d\'un mauvais mot de passe.');
    } else {
      console.error('Test échoué : Le message d\'erreur n\'a pas été affiché.');
    }
  } catch (error) {
    console.error('Une erreur s\'est produite :', error);
  }
}

async function testSuccessfulUploadPhoto(page) {
  try {
    const inputFile = await page.$('button[name="Importer une image"]');
    await inputFile.click();
    if (inputFile) {
      await inputFile.setInputFiles('./upload/hello.jpeg');
      await page.click('text=Enregistrer');
      await page.waitForSelector('text=Mise à jour réussie !');
      await expect(page.locator('text=Mise à jour réussie')).toBeVisible();
    } else {
      console.error('Élément non trouvé : le sélecteur CSS est incorrect ou le bouton n\'est pas présent sur la page.');
    }
  } catch (error) { 
    console.error('Une erreur s\'est produite :', error);
  }
}

async function testVerifyAuthenticationBeforeUpload(page) {
  try {
    const inputFile = await page.$('button[name="Importer une image"]');
    if (!inputFile) {
      console.log('L\'utilisateur n\'est pas connecté');
      testSuccessfulLogin(page);
    }
    testSuccessfulUploadPhoto(page);
    console.log('Test réussi : Téléchargement de la photo de profil après connexion.');
  } catch (error) {
    console.error('Une erreur s\'est produite :', error);
  } finally {
    await browser.close();
  }
};

async function testServerErrorDuringUpload(page) {
  try {
    const inputFile = await page.$('button[name="Importer une image"]');
    await inputFile.click();
    await inputFile.setInputFiles('./upload/hello.jpeg');
    await page.waitForSelector('text=Erreur serveur (500)'); 
    await expect(page.locator('text=Erreur serveur')).toBeVisible();    
    console.log('Test réussi : Connexion réussie, mise à jour échouée en raison d\'une erreur de serveur.');
  } catch (error) {
    console.error('Une erreur s\'est produite :', error);
  }
}


async function testUploadFailureInvalidFileFormat(page) {
    try {
      const inputFile = await page.$('button[name="Importer une image"]');
      await inputFile.click();
      await inputFile.setInputFiles('format_invalid.txt');
      await page.waitForSelector('text=Format de fichier invalide');
      await expect(page.locator('text=Format de fichier invalide')).toBeVisible();    
      } catch (error) {
      console.error('Une erreur s\'est produite :', error);
    }
}