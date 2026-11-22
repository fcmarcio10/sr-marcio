; BR Night Drive — depois de instalar, a pasta do jogo fica escondida (o atalho e o desinstalar continuam funcionando)
!macro NSIS_HOOK_POSTINSTALL
  SetFileAttributes "$INSTDIR" HIDDEN|SYSTEM
!macroend
