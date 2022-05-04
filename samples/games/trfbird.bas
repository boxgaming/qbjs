Import Dom From "lib/web/dom.bas"
' -----------------------------------------------
' QB64 FlappyBird Clone by Terry Ritchie 02/28/14
'
' This program was created to accompany the QB64
' Game Programming course located at:
' http://www.qb64sourcecode.com
'
' You may not sell or distribute this game! It
' was made for instructional purposes only.
'
' Update: 04/29/20
'
' Added EXE icon support in lines 18 and 19
' Any key press now starts game in line 274
' Any key press now flaps bird in line 196
'
' -----------------------------------------------

'$ExeIcon:'.\fbird.ico'
'_Icon

'--------------------------------
'- Variable declaration section -
'--------------------------------

Const FALSE = 0 '            boolean: truth  0
Const TRUE = Not FALSE '     boolean: truth -1
Const LARGE = 0 '            large numbers
Const SMALL = 1 '            small numbers (not used in current version of game)
Const GOLD = 0 '             gold medal
Const SILVER = 1 '           silver medal
Const LIGHT = 0 '            light colored gold/silver medal
Const DARK = 1 '             dark colored gold/silver medal

Type PARALLAX '              parallax scenery settings
    image As Long '          scene image
    x As Integer '           scene image x location
    y As Integer '           scene image y location
    frame As Integer '       current parallax frame
    fmax As Integer '        maximum parallax frames allowed
End Type

Type INFLIGHT '              flappy bird inflight characterisitcs
    y As Single '            flappy bird y location
    yvel As Single '         flappy bird y velocity
    flap As Integer '        wing flap position
    flapframe As Integer '   wing flap frame counter
    angle As Integer '       angle of flappy bird
End Type

Type PIPE '                  pipe characteristics
    x As Integer '           pipe x location
    y As Integer '           pipe y location
End Type

Dim Shared Pipes(3) As PIPE '       define 3 moving sets of pipes
Dim Shared Pipe&(1) '               pipe images 0=top 1=bottom
Dim Shared PipeImage& '             all three pipes drawn image
Dim Shared Birdie As INFLIGHT '     bird flight characteristics
Dim Shared Scenery(4) As PARALLAX ' define 4 moving scenes in parallax
Dim Shared Fbird&(8, 3) '           flapping bird images
Dim Shared Num&(9, 1) '             big and small numeral images
Dim Shared Plaque& '                medal/score plaque
Dim Shared FlappyBird& '            Flappy Bird title image
Dim Shared GameOver& '              Game Over image
Dim Shared GetReady& '              Get Ready image
Dim Shared Medal&(1, 1) '           gold/silver medal images
Dim Shared Finger& '                tap finger image
Dim Shared ScoreButton& '           score button image
Dim Shared ShareButton& '           share button image
Dim Shared StartButton& '           start button image
Dim Shared OKButton& '              OK button image
Dim Shared RateButton& '            RATE button image
Dim Shared MenuButton& '            MENU button image
Dim Shared PlayButton& '            PLAY [|>] button image
Dim Shared PauseButton& '           PAUSE [||] button image
Dim Shared HazardBar& '             Hazard bar parallax image
Dim Shared Clouds& '                Clouds parallax image
Dim Shared City& '                  Cityscape parallax image
Dim Shared Bushes& '                Bushes parallax image
Dim Shared New& '                   red NEW image
Dim Shared Clean& '                 clean playing screen image
Dim Shared HitBird% '               boolean: TRUE if bird hits something
Dim Shared HighScore% '             high score
Dim Shared Score% '                 current score
Dim Shared Paused% '                boolean: TRUE if game paused
Dim Shared Ding& '                  ding sound
Dim Shared Flap& '                  flapping sound
Dim Shared Smack& '                 bird smack sound
Dim Shared Latch% '                 boolean: TRUE if mouse button held down
Dim WinX% '                  stops player from exiting program at will


'------------------------
'- Main Program Section -
'------------------------

Screen _NewImage(432, 768, 32) '                        create 432x768 game screen
_FullScreen
If Not _FullScreen Then GXSceneScale Dom.Container().clientHeight / _Height
_Title "FlappyBird" '                                   give window a title
Cls '                                                   clear the screen
'_Delay .5 '                                             slight delay before moving screen to middle
'_ScreenMove _Middle '                                   move window to center of desktop
'WinX% = _Exit '                                         program will handle all window close requests
LOADASSETS '                                            set/load game graphics/sounds/settings
Birdie.flap = 1 '                                       set initial wing position of bird
Do '                                                    BEGIN MAIN GAME LOOP
    _Limit 60 '                                         60 frames per second
    UPDATESCENERY '                                     update parallaxing scenery
    _PutImage (40, 265), FlappyBird& '                  place game title on screen
    _PutImage (350, 265), Fbird&(2, FLAPTHEBIRD%) '     place flapping bird on screen
    If BUTTON%(64, 535, StartButton&) Then PLAYGAME '   if start button pressed play game
    If BUTTON%(248, 535, ScoreButton&) Then SHOWSCORE ' if score button pressed show scores
'    If BUTTON%(248, 480, RateButton&) Then RATEGAME '   if rate button pressed bring up browser
    _Display '                                          update screen with changes
Loop Until _KeyDown(27) 'Or _Exit '                      END MAIN GAME LOOP when ESC pressed or window closed
CLEANUP '                                               clean the computer's RAM before leaving
System '                                                return to Windows desktop

'-------------------------------------
'- Subroutines and Functions section -
'-------------------------------------

'----------------------------------------------------------------------------------------------------------------------

Function FLAPTHEBIRD% ()

    '*
    '* Returns the next index value used in Fbird&() to animate the bird's
    '* flapping wings.
    '*

    'Shared Birdie As INFLIGHT

    Birdie.flapframe = Birdie.flapframe + 1 '     increment frame counter
    If Birdie.flapframe = 4 Then '                hit limit?
        Birdie.flapframe = 0 '                    yes, reset frame counter
        Birdie.flap = Birdie.flap + 1 '           increment flap counter
        If Birdie.flap = 4 Then Birdie.flap = 1 ' reset flap counter when limit hit
    End If
    FLAPTHEBIRD% = Birdie.flap '                  return next index value

End Function

'----------------------------------------------------------------------------------------------------------------------

Sub MOVEPIPES ()

    '*
    '* Creates and moves the pipe images across the screen.
    '*

    'Shared Pipes() As PIPE , Pipe&(), PipeImage&, Paused%, Score%, Ding&

    Dim p% ' counter indicating which pipe being worked on

    _Dest PipeImage& '                                    work on this image
    Cls , _RGBA32(0, 0, 0, 0) '                           clear image with transparent black
    _Dest 0 '                                             back to work on screen
    Do '                                                  BEGIN PIPE LOOP
        p% = p% + 1 '                                     increment pipe counter
        If Not Paused% Then '                             is game paused?
            Pipes(p%).x = Pipes(p%).x - 3 '               no, move pipe to the left
            If Pipes(p%).x < -250 Then '                  hit lower limit?
                Pipes(p%).x = 500 '                       yes, move pipe all the way right
                Pipes(p%).y = -(Int(Rnd(1) * 384) + 12) ' generate random pipe height position
            End If
            If Pipes(p%).x = 101 Then '                   is pipe crossing bird location?
                _SndPlay Ding& '                          play ding sound
                Score% = Score% + 1 '                     increment player score
            End If
        End If
        If Pipes(p%).x > -78 And Pipes(p%).x < 432 Then ' is pipe currently seen on screen?
            _PutImage (Pipes(p%).x, Pipes(p%).y), Pipe&(0), PipeImage& ' place top pipe
            _PutImage (Pipes(p%).x, Pipes(p%).y + 576), Pipe&(1), PipeImage& ' place bottom pipe
        End If
    Loop Until p% = 3 '                                   END PIPE LOOP when all pipes moved
    _PutImage (0, 0), PipeImage& '                        place pipe image on screen

End Sub

'----------------------------------------------------------------------------------------------------------------------

Sub FLYBIRDIE ()

    '*
    '* Controls the flight of bird on screen.
    '*

    'Shared Birdie As INFLIGHT, Fbird&(), Paused%, Flap&, HitBird%, Latch%, Smack&

    Dim b% '     boolean: TRUE if left mouse button pressed
    Dim Angle% ' angle of bird in flight

    If Not Paused% Then '                             is game paused?
        While _MouseInput: Wend '                     no, get latest mouse information
        b% = _MouseButton(1) '                        get left mouse button status
        If _KeyHit > 0 Then b% = -1 '                 any key will also make bird flap    (added 04/29/20)
        If Not b% Then Latch% = FALSE '               release latch if button let go
        If Not HitBird% Then '                        has bird hit something?
            If Not Latch% Then '                      no, has left button been release?
                If b% Then '                          yes, was left button pressed?
                    Birdie.yvel = -8 '                yes, reset bird y velocity
                    _SndPlay Flap& '                  play flap sound
                    Latch% = TRUE '                   remember mouse button pressed
                End If
            End If
        End If
        Birdie.yvel = Birdie.yvel + .5 '              bleed off some bird y velocity
        Birdie.y = Birdie.y + Birdie.yvel '           add velocity to bird's y direction
        If Not HitBird% Then '                        has bird hit something?
            If Birdie.y < -6 Or Birdie.y > 549 Then ' no, has bird hit top/bottom of screen?
                HitBird% = TRUE '                     yes, remeber bird hit something
                _SndPlay Smack& '                     play smack sound
            End If
        End If
        If Birdie.yvel < 0 Then '                     is bird heading upward?
            Birdie.angle = 1 '                        yes, set angle of bird accordingly
        Else
            Angle% = Int(Birdie.yvel * .5) + 1 '      calculate angle according to bird velocity
            If Angle% > 8 Then Angle% = 8 '           keep angle within limits
            Birdie.angle = Angle% '                   set bird angle
        End If
    End If
    _PutImage (100, Birdie.y), Fbird&(Birdie.angle, FLAPTHEBIRD%) ' place bird on screen

End Sub

'----------------------------------------------------------------------------------------------------------------------

Sub UPDATESCORE ()

    '*
    '* Displays player's score on screen.
    '*

    'Shared Num&(), Score%

    Dim s$ ' score in string format
    Dim w% ' width of score string
    Dim x% ' x location of score digits
    Dim p% ' position counter

    s$ = LTrim$(RTrim$(Str$(Score%))) ' convert score to string
    w% = Len(s$) * 23 '                 calculate width of score
    x% = (432 - w%) / 2 '               calculate x position of score
    For p% = 1 To Len(s$) '             cycle through each position in score string
        _PutImage (x%, 100), Num&(Asc(Mid$(s$, p%, 1)) - 48, LARGE) ' place score digit on screen
        x% = x% + 23 '                  move to next digit position
    Next p%

End Sub

'----------------------------------------------------------------------------------------------------------------------

Sub READY ()

    '*
    '* displays instructions to the player and waits for player to start game.
    '*

    'Shared Fbird&(), Finger&, GetReady&

    Dim b% ' boolean: TRUE if left mouse button pressed

    Do '                                 BEGIN READY LOOP
        _Limit 60 '                      60 frames per second
        UPDATESCENERY '                  move parallax scenery
        _PutImage (180, 350), Finger& '  place finger instructions on screen
        _PutImage (85, 225), GetReady& ' place get ready image on screen
        _PutImage (100, 375), Fbird&(2, FLAPTHEBIRD%) ' place bird on screen
        UPDATESCORE '                    place score on screen
        _Display '                       update screen with changes
        While _MouseInput: Wend '        get latest mouse information
        b% = _MouseButton(1) '           get status of left mouse button
        If _KeyHit > 0 Then b% = -1 '    any key press will also begin game           (added 04/29/20)
        'If _Exit Then CLEANUP: System '  leave game if user closes game window
    Loop Until b% '                      END READY LOOP when left button pressed
    _Delay .2 '                          slight delay to allow mouse button release

End Sub

'----------------------------------------------------------------------------------------------------------------------

Sub PLAYGAME ()

    '*
    '* Allows player to play the game.
    '*

    'Shared Pipes() As PIPE, Birdie As INFLIGHT, PauseButton&, PlayButton&, Paused%, HitBird%, Score%

    'Randomize Timer '                                seed random number generator
    Score% = 0 '                                     reset player score
    Birdie.y = 0 '                                   reset bird y location
    Birdie.yvel = 0 '                                reset bird y velocity
    Birdie.flap = 1 '                                reset bird wing flap index
    Pipes(1).x = 500 '                               reset position of first pipe
    Pipes(2).x = 749 '                               reset position of second pipe
    Pipes(3).x = 998 '                               reset position of third pipe
    Pipes(1).y = -(Int(Rnd(1) * 384) + 12) '         calculate random y position of pipe 1
    Pipes(2).y = -(Int(Rnd(1) * 384) + 12) '         calculate random y position of pipe 2
    Pipes(3).y = -(Int(Rnd(1) * 384) + 12) '         calculate random y position of pipe 3
    READY '                                          display instructions to player
    Do '                                             BEGIN GAME PLAY LOOP
        _Limit 60 '                                  60 frames per second
        UPDATESCENERY '                              move parallax scenery
        MOVEPIPES '                                  move pipes
        UPDATESCORE '                                display player score
        FLYBIRDIE '                                  move and display bird
        CHECKFORHIT '                                check for bird hits
        If Not Paused% Then '                        is game paused?
            If BUTTON%(30, 100, PauseButton&) Then ' no, was pause button pressed?
                Paused% = TRUE '                     yes, place game in pause state
            End If
        Else '                                       no, game is not paused
            If BUTTON%(30, 100, PlayButton&) Then '  was play button pressed?
                Paused% = FALSE '                    yes, take game out of pause state
            End If
        End If
        _Display '                                   update screen with changes
        'If _Exit Then CLEANUP: System '              leave game if user closes game window
    Loop Until HitBird% '                            END GAME PLAY LOOP if bird hits something
    Do '                                             BEGIN BIRD DROPPING LOOP
        _Limit 60 '                                  60 frames per second
        Paused% = TRUE '                             place game in paused state
        UPDATESCENERY '                              draw parallax scenery
        MOVEPIPES '                                  draw pipes
        Paused% = FALSE '                            take game out of pause state
        FLYBIRDIE '                                  move bird on screen
        _Display '                                   update screen with changes
        'If _Exit Then CLEANUP: System '              leave game if user closes game window
    Loop Until Birdie.y >= 546 '                     END BIRD DROPPING LOOP when bird hits ground
    SHOWSCORE '                                      display player's score plaque
    HitBird% = FALSE '                               reset bird hit indicator

End Sub

'----------------------------------------------------------------------------------------------------------------------

Sub CHECKFORHIT ()

    '*
    '* Detects if bird hits a pipe.
    '*

    'Shared Pipes() As PIPE, Birdie As INFLIGHT, HitBird%, Smack&

    Dim p% ' pipe counter

    For p% = 1 To 3 '                                      cycle through all pipe positions
        If Pipes(p%).x <= 153 And Pipes(p%).x >= 22 Then ' is pipe in bird territory?
            If BOXCOLLISION(105, Birdie.y + 6, 43, 41, Pipes(p%).x, Pipes(p%).y, 78, 432) Then ' collision?
                HitBird% = TRUE '                          yes, remember bird hit pipe
            End If
            If BOXCOLLISION(105, Birdie.y + 6, 43, 41, Pipes(p%).x, Pipes(p%).y + 576, 78, 432) Then ' collision?
                HitBird% = TRUE '                          yes, remember bird hit pipe
            End If
        End If
    Next p%
    If HitBird% Then _SndPlay Smack& '                     play smack sound if bird hit pipe

End Sub

'----------------------------------------------------------------------------------------------------------------------

Sub RATEGAME ()

    '*
    '* Allows player to rate game.
    '*

    'Shell "https://www.qb64.org/forum/index.php?topic=437.0" ' go to QB64 web site forum area for flappy bird

End Sub

'----------------------------------------------------------------------------------------------------------------------

Sub SHOWSCORE ()

    '*
    '* Display's current and high scores on score plaque
    '*

    'Shared Fbird&(), Num&(), Medal&(), FlappyBird&, GameOver&, Plaque&, OKButton&, ShareButton&
    'Shared HitBird%, HighScore%, Score%, New&

    Dim Ok% '        boolean: TRUE if OK button pressed
    Dim Scores%(1) ' current and high scores
    Dim sc% '        current score being drawn
    Dim x% '         x location of score digits
    Dim p% '         digit position counter
    Dim ShowNew% '   boolean: TRUE if score is a new high score
    Dim s$ '         score in string format

    If Score% > HighScore% Then '                               is this a new high score?
        'Open "fbird.sco" For Output As #1 '                     yes, open score file
        'Print #1, Score% '                                      save new high score
        'Close #1 '                                              close score file
        HighScore% = Score% '                                   remember new high score
        ShowNew% = TRUE '                                       remember this is a new high score
    End If
    Scores%(0) = Score% '                                       place score in array
    Scores%(1) = HighScore% '                                   place high score in array
    Ok% = FALSE '                                               reset OK button status indicator
    Do '                                                        BEGIN SCORE LOOP
        _Limit 60 '                                             60 frames per second
        If HitBird% Then '                                      did bird hit something?
            _PutImage (75, 200), GameOver& '                    yes, place game over image on screen
        Else '                                                  no, bird did not hit anything
            UPDATESCENERY '                                     move parallax scenery
            _PutImage (40, 200), FlappyBird& '                  place flappy bird title on screen
            _PutImage (350, 200), Fbird&(2, FLAPTHEBIRD%) '     place flapping bird on screen
        End If
        _PutImage (46, 295), Plaque& '                          place plaque on screen
        'Select Case HighScore% '                                what is range of high score?
        '    Case 25 TO 49 '                                     from 25 to 49
        '        _PutImage (85, 360), Medal&(SILVER, LIGHT) '    display a light silver medal
        '    Case 50 TO 99 '                                     from 50 to 99
        '        _PutImage (85, 360), Medal&(SILVER, DARK) '     display a dark silver medal
        '    Case 100 TO 199 '                                   from 100 to 199
        '        _PutImage (85, 360), Medal&(GOLD, LIGHT) '      display a light gold medal
        '    Case Is > 199 '                                     from 200 and beyond
        '        _PutImage (85, 360), Medal&(GOLD, DARK) '       display a dark gold medal
        'End Select
        For sc% = 0 To 1 '                                      cycle through both scores
            s$ = LTrim$(RTrim$(Str$(Scores%(sc%)))) '           convert score to string
            x% = 354 - Len(s$) * 23 '                           calculate position of score digit
            For p% = 1 To Len(s$) '                             cycle through score string
                _PutImage (x%, 346 + sc% * 64), Num&(Asc(Mid$(s$, p%, 1)) - 48, LARGE) ' place digit on plaque
                x% = x% + 23 '                                  increment digit position
            Next p%
        Next sc%
        If ShowNew% Then _PutImage (250, 382), New& '           display red new image if new high score
        If BUTTON%(64, 535, OKButton&) Then Ok% = TRUE '        remember if OK button was pressed
        If BUTTON%(248, 535, ShareButton&) Then '               was share button pressed?
            SHAREPROGRAM '                                      yes, share program with others
            UPDATESCENERY '                                     draw parallax scenery
            MOVEPIPES '                                         draw pipes
        End If
        _Display '                                              update screen with changes
        'If _Exit Then CLEANUP: System '                         leave game if user closes game window
    Loop Until Ok% '                                            END SCORE LOOP when OK button pressed

End Sub

'----------------------------------------------------------------------------------------------------------------------

Sub SHAREPROGRAM ()

    '*
    '* Allows player to share program with others
    '*

    'Shared Fbird&(), FlappyBird&, OKButton&

    Dim Message& ' composed message to player's friend(s)
    Dim Ok% '      boolean: TRUE if OK button pressed

    Message& = _NewImage(339, 174, 32) '                   create image to hold message to player
    '_Clipboard$ = "I just discovered a great game! You can download it here: http:\\www.qb64sourcecode.com\fbird.exe"
    '_PrintMode _KeepBackground '                           printed text will save background
    Line (58, 307)-(372, 453), _RGB32(219, 218, 150), BF ' clear plaque image
    Color _RGB32(210, 170, 79) '                           compose message to player on plaque
    _PrintString (66, 316), "The following message has been copied"
    Color _RGB32(82, 55, 71)
    _PrintString (65, 315), "The following message has been copied"
    Color _RGB32(210, 170, 79)
    _PrintString (66, 331), "to your computer's clipboard:"
    Color _RGB32(82, 55, 71)
    _PrintString (65, 330), "to your computer's clipboard:"
    Color _RGB32(210, 170, 79)
    _PrintString (66, 351), "'I just discovered a great game! You"
    Color _RGB32(82, 55, 71)
    _PrintString (65, 350), "'I just discovered a great game! You"
    Color _RGB32(210, 170, 79)
    _PrintString (66, 366), "can download it here:"
    Color _RGB32(82, 55, 71)
    _PrintString (65, 365), "can download it here:"
    Color _RGB32(210, 170, 79)
    _PrintString (66, 381), "www.qb64sourcecode.com\fbird.exe'"
    Color _RGB32(82, 55, 71)
    _PrintString (65, 380), "www.qb64sourcecode.com\fbird.exe'"
    Color _RGB32(210, 170, 79)
    _PrintString (66, 401), "Create an email for your friends and"
    Color _RGB32(82, 55, 71)
    _PrintString (65, 400), "Create an email for your friends and"
    Color _RGB32(210, 170, 79)
    _PrintString (66, 416), "paste this message into it! Go ahead,"
    Color _RGB32(82, 55, 71)
    _PrintString (65, 415), "paste this message into it! Go ahead,"
    Color _RGB32(210, 170, 79)
    _PrintString (66, 431), "do it now before you change your mind!"
    Color _RGB32(82, 55, 71)
    _PrintString (65, 430), "do it now before you change your mind!"
    _PutImage , _Dest, Message&, (46, 295)-(384, 468) '    place message in image
    Do '                                                   BEGIN SHARE LOOP
        _Limit 60 '                                        60 frames per second
        UPDATESCENERY '                                    move parallax scenery
        _PutImage (40, 200), FlappyBird& '                 place flappy bird title on screen
        _PutImage (350, 200), Fbird&(2, FLAPTHEBIRD%) '    place flapping bird on screen
        _PutImage (46, 295), Message& '                    place message on plaque
        If BUTTON%(156, 535, OKButton&) Then Ok% = TRUE '  remeber if OK button pressed
        _Display '                                         update screen with changes
        'If _Exit Then CLEANUP: System '                    leave game if user closes game window
    Loop Until Ok% '                                       END SHRE LOOP when OK button pressed
    _FreeImage Message& '                                  message image no longer needed

End Sub

'----------------------------------------------------------------------------------------------------------------------

Function BUTTON% (xpos As Integer, ypos As Integer, Img As Long)

    '*
    '* Creates a button on the screen the player can click with the mouse button.
    '*
    '* xpos%  - x coordinate position of button on screen
    '* ypos%  - y coordinate position of button on screen
    '* Image& - button image
    '*
    '* Returns: boolean: TRUE  if button pressed
    '*                   FALSE if button not pressed
    '*

    Dim x% ' current mouse x coordinate
    Dim y% ' current mouse y coordinate
    Dim b% ' boolean: TRUE if left mouse button pressed

    _PutImage (xpos, ypos), Img '                      place button image on the screen
    While _MouseInput: Wend '                               get latest mouse information
    x% = _MouseX '                                          get current mouse x coordinate
    y% = _MouseY '                                          get current mouse y coordinate
    b% = _MouseButton(1)
    If b% Then '                                            is left mouse button pressed?
        If x% >= xpos Then '                               yes, is mouse x within lower limit of button?
            If x% <= xpos + _Width(Img) Then '          yes, is mouse x within upper limit of button?
                If y% >= ypos Then '                       yes, is mouse y within lower limit of button?
                    If y% <= ypos + _Height(Img) Then ' yes, is mouse y within upper limit of button?
                        BUTTON% = TRUE '                    yes, remember that button was clicked on
                        _Delay .2 '                         slight delay to allow button to release
                    End If
                End If
            End If
        End If
    End If

End Function

'----------------------------------------------------------------------------------------------------------------------

Sub UPDATESCENERY ()

    '*
    '* Updates the moving parallax scenery
    '*

    'Shared Scenery() As PARALLAX, Clean&, HazardBar&, Paused%

    Dim c% ' scenery index indicator

    _PutImage , Clean& '                                              clear screen with clean image
    Do '                                                              BEGIN SCENERY LOOP
        c% = c% + 1 '                                                 increment index value
        If Not Paused% Then '                                         is game in paused state?
            Scenery(c%).frame = Scenery(c%).frame + 1 '               no, update frame counter of current scenery
            If Scenery(c%).frame = Scenery(c%).fmax Then '            frame counter hit limit?
                Scenery(c%).frame = 0 '                               yes, reset frame counter
                Scenery(c%).x = Scenery(c%).x - 1 '                   move scenery 1 pixel to left
                If Scenery(c%).x = -432 Then '                        scenery hit lower limit?
                    Scenery(c%).x = 0 '                               yes, reset scenery to start position
                End If
            End If
        End If
        _PutImage (Scenery(c%).x, Scenery(c%).y), Scenery(c%).image ' place current scenery on screen
    Loop Until c% = 3 '                                               END SCENERY LOOP when all scenery updated
    If Not Paused% Then '                                             is game in paused state?
        Scenery(4).x = Scenery(4).x - 3 '                             no, move hazard bar 3 pixels to left
        If Scenery(4).x = -21 Then Scenery(4).x = 0 '                 reset to start position if lower limit hit
    End If
    _PutImage (Scenery(4).x, Scenery(4).y), HazardBar& '              place hazard bar on screen

End Sub

'----------------------------------------------------------------------------------------------------------------------

Sub LOADASSETS ()

    '*
    '* Loads game graphics, sounds and initial settings.
    '*

    'Shared Scenery() As PARALLAX, Birdie As INFLIGHT, Pipes() As PIPE, Pipe&(), Fbird&()
    'Shared Num&(), Medal&(), Plaque&, FlappyBird&, GameOver&, GetReady&, Finger&
    'Shared ScoreButton&, ShareButton&, StartButton&, OKButton&, RateButton&, MenuButton&
    'Shared PlayButton&, PauseButton&, HazardBar&, Clouds&, City&, Bushes&, New&, Clean&
    'Shared HighScore%, PipeImage&, Ding&, Flap&, Smack&

    Dim Sheet& '    sprite sheet image
    Dim x% '        generic counter
    Dim y% '        generic counter
    Dim PipeTop& '  temporary top of pipe image
    Dim PipeTube& ' temporary pipe tube image

    Ding& = _SndOpen("data:audio/ogg;base64,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") '         load game sounds
    Flap& = _SndOpen("data:audio/ogg;base64,T2dnUwACAAAAAAAAAAD/PAAAAAAAAKh2IzwBHgF2b3JiaXMAAAAAASJWAAAAAAAAUMMAAAAAAACpAU9nZ1MAAAAAAAAAAAAA/zwAAAEAAACH1LF/EC3//////////////////wwDdm9yYmlzHQAAAFhpcGguT3JnIGxpYlZvcmJpcyBJIDIwMDQwNjI5AAAAAAEFdm9yYmlzJEJDVgEAQAAAGEIQKgWtY446yBUhjBmioELKKccdQtAhoyRDiDrGNccYY0e5ZIpCyYHQkFUAAEAAAKQcV1BySS3nnHOjGFfMcegg55xz5SBnzHEJJeecc44555JyjjHnnHOjGFcOcikt55xzgRRHinGnGOecc6QcR4pxqBjnnHNtMbeScs4555xz5iCHUnKuNeecc6QYZw5yCyXnnHPGIGfMcesg55xzjDW31HLOOeecc84555xzzjnnnHOMMeecc84555xzbjHnFnOuOeecc8455xxzzjnnnHMgNGQVAJAAAKChKIriKA4QGrIKAMgAABBAcRRHkRRLsRzL0SQNCA1ZBQAAAQAIAACgSIakSIqlWI5maZ4meqIomqIqq7JpyrIsy7Lrui4QGrIKAEgAAFBRFMVwFAcIDVkFAGQAAAhgKIqjOI7kWJKlWZ4HhIasAgCAAAAEAABQDEexFE3xJM/yPM/zPM/zPM/zPM/zPM/zPM/zPA0IDVkFACAAAACCKGQYA0JDVgEAQAAACCEaGUOdUhJcChZCHBFDHULOQ6mlg+AphSVj0lOsQQghfO89995774HQkFUAABAAAGEUOIiBxyQIIYRiFCdEcaYgCCGE5SRYynnoJAjdgxBCuJx7y7n33nsgNGQVAAAIAMAghBBCCCGEEEIIKaSUUkgppphiiinHHHPMMccggwwy6KCTTjrJpJJOOsoko45Saym1FFNMseUWY6211pxzr0EpY4wxxhhjjDHGGGOMMcYYIwgNWQUAgAAAEAYZZJBBCCGEFFJIKaaYcswxxxwDQkNWAQCAAAACAAAAHEVSJEdyJEeSJMmSLEmTPMuzPMuzPE3URE0VVdVVbdf2bV/2bd/VZd/2ZdvVZV2WZd21bV3WXV3XdV3XdV3XdV3XdV3XdV3XgdCQVQCABACAjuQ4juQ4juRIjqRIChAasgoAkAEAEACAoziK40iO5FiOJVmSJmmWZ3mWp3maqIkeEBqyCgAABAAQAAAAAACAoiiKoziOJFmWpmmep3qiKJqqqoqmqaqqapqmaZqmaZqmaZqmaZqmaZqmaZqmaZqmaZqmaZqmaZqmaQKhIasAAAkAAB3HcRxHcRzHcSRHkiQgNGQVACADACAAAENRHEVyLMeSNEuzPMvTRM/0XFE2dVNXbSA0ZBUAAAgAIAAAAAAAAMdzPMdzPMmTPMtzPMeTPEnTNE3TNE3TNE3TNE3TNE3TNE3TNE3TNE3TNE3TNE3TNE3TNE3TNE3TNE0DQkNWAgBkAAActVZz772HjDlIsfYeM6UYtJh7zhQySlLtrWNGGCa1p5AhYhTUnkrIEFLQeymhU4pJ7ymlUkqqvfdaY+299x4IDVkRAEQBAAAIIcYQY4gxBiGDEDHGIGQQIsYchAxCBiGUEkrJIIRSQkkRcw5CByGDEEoJoWQQQikhlQIAAAIcAAACLIRCQ1YEAHECAAhCziHGIESMQQglpBRCSCliDELmnJTMOSmllNZCKalFjEHInJOSOScllNJSKaW1UEprJZXYQimttdZqTa3FGkppLZTSWimltdRajS22WiPGIGTOScmck1JSaa2U1FrmnJQOQkodhJRSSi2WlFrMnJPSQUelg5BSSSW2klKMIZUYS0oxlpRibC3G3FqsOZTSWkkltpJSjCmmGluMOUeMQcick5I5J6WU0lopqbXMOSkdhJQ6ByWVlGIsJbWYOSepg5BSByGlklJsKaXYQimtlZRiLCW12GLMNaXYaikpxpJSjCWlGFuMtbbYauwktBZSiTGU0mKLsdbWYq0hlRhLSjGWlGJsMeYcY6w5lNJiSSW2klKMLbZcY4w1p9ZybS3m3GLMtcZce6y599Raram1XFuMOccae6219t5BaC2UElsoJcbWWq2txZxDKbGVlGIsJcXaYsy5tVhzKCXGklKMJaUYW4y1xhpzTa3V2mLMNbVWc62159hq7anFmluMtbfYco259l5z7LEAAIABBwCAABPKQKEhKwGAKAAAwhilGIPQIKSUYxAahJRiDkKlFGPOSamUYsw5KJljzkEoJXPOOQilhBBKKCWlEEIppaRUAABAgQMAQIANmhKLAxQashIACAkAIIxRijHnIJSSUkoRQow5ByGEUlJqKUKIMecghFBKSq1VjDHmHIQQSkmptYoxxpyDEEIpKbWWOecchBBKSam11jLnnIMQQikppdZaCCGEUEopJaXWYuwghFBCKaWk1FqMIYQQSiklpdRaizGEEEIppaTUUmsxllJKSSml1FprMdZSSikppdRSa7HFmFJKqbXWWosxxlpTSim11lprscVYa2qttdZijDHGWmtNrbXWWowx1lhrrQUAABw4AAAEGEEnGVUWYaMJFx6AQkNWBABRAACAMYgxxBiCjknIJEQOMigZlAZCSKmjlFEqJZYaM0olphJrBKGjFFLKKJUaS6sZpRJjiaUAALADBwCwAwuh0JCVAEAeAACBkFKMOeccQogxxpxzDiHFGGPOOacYY8w555xTjDHmnHPOMcaccw5CCBljzjkHIYTOOecghBBC55xzEEIIoXPOOQghhNA55xyEEEIoAACowAEAIMBGkc0JRoIKDVkJAKQCAADGMOaccxBKaZRyDkIIpbTUKOUchBBKSS1zDkIppbQWW+YchFJKSa21DkIpKaXUWowdhFJSSqnFGDsIpaTUWoy1dhBKSam1GGsNpaQWW6y11hpKSa3FGGuttaTUWoy15pxzSam1GGutNecCAMATHACACmxYHeGkaCyw0JCVAEAGAABhDEIIIYQQQgghhJRCCCklAABgwAEAIMCEMlBoyEoAIBUAADCGMcacg1BKoxSEEEIoJaVGKQchhFBSS5mDUkpJJbUWMwillFJKajFm0ElJKbUWY80glJJSajHG2EEoKbXWYoyxg1BSSq3FWGsopaUWY6wxxlBKSq3FGmONJaUWa6251lpLSq3FGGutuRYAgNDgAAB2YMPqCCdFY4GFhqwEAPIAABCElGKMMcaQUowxxphzSCmlGGPMOaUYY44555xijDHGnHOOMcaYc845xxhjzjnnnGOMOeecc84xxpxzzjnnmHPOOeecc8w555xzzjkBAEAFDgAAATaKbE4wElRoyEoAIBwAAECIMecYc05CSo1SzkkIHYRSWm0UcxBK6CCU1lLmnJRSQiglxdgy5yClEkIqLaXaQUglpVJSiq22DkJqKZXSUmutZs5BKKWklmKsLXMQQikppdZqrZ2EklJKtbVYawwhlJRSa622GmsppaWWaqyx1lhDKaml2GKstcZaYmwttRprrK3GklJLrdVaY621FgBg8uAAAJVg4wwrSWeFo8GFhqwEAHIDAAiEGHPOOQgllBBCKaVESjHmHIQQSiillFJSiZRizDkHoZRSSimllJIx5hx0EEoopZRSUkklY8w5ByGUUEoppZRSSucchBBKKKWUUkoqJZXOOQchhFJKKaWUklIpHYQQQiillFJSSSWVVDoIIYRSSimllFJSKqWEEkIpJZVSSimlpJRSCiGUUEoppaSSSkoplRJKKKWUVEopJZVUUikplFJKKaWUVEpKJaWUUgillFJSKamUVEpKKaVQSimllFRSSSWllFJJpZRSSiklpZRSSimVlEoppaRSSioppVRaSqmUUkpJpZSUWkoppZRSKqWkklJKKaWUUkoppVRKSSWVklJKKaWUUkqllFJKSamkVFIqKaWSUgEAQAcOAAABRlRaiJ1mXHkEjihkmIAKDVkJAIQDAABSSimllFJKiYyUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSGimllFJKKaVUCkkpJYQQQgghQgJAujIcAAACrElXL1JdxuhgdOnKLmh0eJGjQwAKAJCukdWEJTRkJQCQFgAAWGmllZZaa6211iIEpaXUWmuttdZaayWEFFJqqbXWWmuttc5JCi211lprrbXWWugktdRSa6211lprrYOUSmuttdZaa621FkpqqaXWWmuttdZaCyG11lprrbXWWmuttdZaa6211lprrbXWWmuttdZaa6211lprrbXWWmuttdZaa6211lprrbXWWmuttdZaaymllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSihyEjkJKKaWUUkoRMs45J6GUlFJKKaXICABAjHAAAAiwhNhVuZmkXj0bEsPkJH2K4WoM3wIAMWGMCQ1ZBQDEAAAAhBjGmGOMMeecY84555xzjkHoIITOOeecc845Z62kAgAAExwAAAKsYFdmadVGcVMnedEHgU/oiM3IkEupmMmJoEdqqMVKsEMruMELwEJDVgIAZAAAEJNSUopFWQgp5qAl5SFjFIOYlIeMQcpZUBpCxiBmxXiMKYSUFCNC6BRSUIyKMXaMQS8yGJ9CCMHoYoyOsRYjAAAAQQCAgJAAAAMEBTMAwOAAYeRAoCOAwKENADAQITOBQSE0OMgEgAeICKkAIDFBUbrQBSFEkC6CLB64cOLGEzec0KENAgAAAAAAAgA+AAASCiAimpm5CosLjAyNDY4Ojw+QEJGRAAAAAAAAAYAPAICEBIiIZmauwuICI0Njg6PD4wMkRGQkAAAAAAAAAAAACAgIAAAAAAAEAAAACAhPZ2dTAAR0BgAAAAAAAP88AAACAAAAKmSZkQh9dYB5eHZ2b3xVuaAURivIr+A0yajdie71/ytp2/mEvTe/arCT2+auOUnp+Wtz+sO/S2i8zmFcm/Sn/e5613JyrShy634j9+Yu7lqT5mWvYiN+1BKNWTj/zZP2nHS4yK31xFhLGqs4x5sHH2w5CPisuTVSJXaIe8JsXM5vX9/tRuZ1O2sQREcAiMRPx69DX3LaLff2lnk8XaSzvrJniM/aXXQ2SHNmxq3dTn3WWW4jxsv5T9ncsGXtLX8MiWeX8ZTkw+UZr9FbR9GYtLdifppcKM0H1wfzrUf77tF0up7sOsJqY4rZ8LEaKafMtRE2Dc1qiEP6ktGoxWgCVE9tCTPNTVESrn7+5e/Hf3r9pjPnDhgcr2u+20zqRqS7EZ54YlBfqqLTfPDOPf/rXSffmTcn82iN2hy55quFetD5CwcdDfIpbmj/v0/WyIXlGuT/e+GXxVloytI4Dy3d5Z+RTOmGOUrksklkbXL2/HJb28T8Nn6w3TNl+5hGDQBsTa3pc/sqkiN8b301qnf0CfpU9xS0KPW2brrm0tVBLTsfHp5YXuMpPl3n24+4RDW3/Hjz/Eb6C09Oo2kmR20Rm62xv5A2u2S73XRyUDpXT/dz89jzfXFljN7dRmelt94+3aOpM6R3syWDhz9P/0/StXSxx5XaP74BREc4qbmnEiSicmtw37cu+F2kv1XIqKYZtv5CahY266ktFkucaXYdNlbj7Y+Hhw69/P89mk8kp/aOw2byfFriOjs8tN1NfKrRSDmTPtLfmUYGfp3747NM756OT/MqlUhaoowysDPbjUQnxsHOE0/R8r0Szwz9/tUKHD3zCYalQEKCvf5OfnaXo3PLJ4daU32ylqZtNjeJmVf8PF0Rb/70N0vO/UliCVsv3PK9vbvt7sTD209IbC/yZNyw6o/bybUNIcv5hGo1ooahfkut/x7/ni6i9ndJrC1NV7Xtxr/hJdMqBGO7x2j6dLMP9yfrpgy7qYiocI8iPQ2Waj2Gqky5WRoa/OBoo/f0/Z8MuXj/2vj4reTzxswyTxwOh4si5tFwykh1mtP+zmOsD9LO+N1j++TkrCzUeuLsJH7cdDP3fMcZyd01u7PmMcOqsa6cwvre6nvr2i6GxObJCGGwJH9n4rSUaQXkrokFg2NfBVhkjAhZj6QU25OCdWv71pDxtneGhHMQd+Zyx8/3Fad7TjWq+Y+n0trbnk/p8yeJe47/+OVaTZLt0zvUSWm3Tm9PJB/+b31YrWK18PgkrfeL1vxJqk1WaZNYp0//uxDKV9paY1n1908=")
    Smack& = _SndOpen("data:audio/ogg;base64,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")
    Sheet& = _LoadImage("data:image/png;base64,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") '             load sprite sheet
    For y% = 0 To 2 '                                          cycle through bird image rows
        For x% = 0 To 7 '                                      cycle through bird image columns
            Fbird&(x% + 1, y% + 1) = _NewImage(53, 53, 32) '   create image holder then get image
            _PutImage , Sheet&, Fbird&(x% + 1, y% + 1), (x% * 53, y% * 53)-(x% * 53 + 52, y% * 53 + 52)
        Next x%
    Next y%
    For x% = 0 To 9 '                                          cycle trough 9 numeral images
        Num&(x%, 0) = _NewImage(21, 30, 32) '                  create image holder for big
        Num&(x%, 1) = _NewImage(18, 21, 32) '                  create image holder for small
        _PutImage , Sheet&, Num&(x%, 0), (x% * 21, 159)-(x% * 21 + 20, 188) ' get images
        _PutImage , Sheet&, Num&(x%, 1), (x% * 18 + 210, 159)-(x% * 18 + 227, 179)
    Next x%
    Plaque& = _NewImage(339, 174, 32) '                        define remaining image sizes
    FlappyBird& = _NewImage(288, 66, 32)
    GameOver& = _NewImage(282, 57, 32)
    GetReady& = _NewImage(261, 66, 32)
    PipeTop& = _NewImage(78, 36, 32)
    PipeTube& = _NewImage(78, 36, 32)
    Pipe&(0) = _NewImage(78, 432, 32)
    Pipe&(1) = _NewImage(78, 432, 32)
    PipeImage& = _NewImage(432, 596, 32)
    Medal&(0, 0) = _NewImage(66, 66, 32)
    Medal&(0, 1) = _NewImage(66, 66, 32)
    Medal&(1, 0) = _NewImage(66, 66, 32)
    Medal&(1, 1) = _NewImage(66, 66, 32)
    Finger& = _NewImage(117, 147, 32)
    ScoreButton& = _NewImage(120, 42, 32)
    ShareButton& = _NewImage(120, 42, 32)
    StartButton& = _NewImage(120, 42, 32)
    OKButton& = _NewImage(120, 42, 32)
    RateButton& = _NewImage(120, 42, 32)
    MenuButton& = _NewImage(120, 42, 32)
    PlayButton& = _NewImage(39, 42, 32)
    PauseButton& = _NewImage(39, 42, 32)
    HazardBar& = _NewImage(462, 24, 32)
    Clouds& = _NewImage(864, 120, 32)
    City& = _NewImage(864, 57, 32)
    Bushes& = _NewImage(864, 27, 32)
    New& = _NewImage(48, 21, 32)
    _PutImage , Sheet&, Plaque&, (0, 189)-(338, 362) '         grab images from sprite sheet
    _PutImage , Sheet&, FlappyBird&, (0, 363)-(287, 428)
    _PutImage , Sheet&, GameOver&, (588, 246)-(869, 302)
    _PutImage , Sheet&, GetReady&, (588, 303)-(847, 368)
    _PutImage , Sheet&, Medal&(0, 0), (339, 327)-(404, 392)
    _PutImage , Sheet&, Medal&(0, 1), (405, 327)-(470, 392)
    _PutImage , Sheet&, Medal&(1, 0), (339, 261)-(404, 326)
    _PutImage , Sheet&, Medal&(1, 1), (405, 261)-(470, 326)
    _PutImage , Sheet&, Finger&, (471, 246)-(587, 392)
    _PutImage , Sheet&, ScoreButton&, (288, 417)-(407, 458)
    _PutImage , Sheet&, ShareButton&, (408, 417)-(527, 458)
    _PutImage , Sheet&, StartButton&, (528, 417)-(647, 458)
    _PutImage , Sheet&, OKButton&, (424, 204)-(543, 245)
    _PutImage , Sheet&, RateButton&, (544, 204)-(663, 245)
    _PutImage , Sheet&, MenuButton&, (664, 204)-(783, 245)
    _PutImage , Sheet&, PlayButton&, (784, 204)-(822, 245)
    _PutImage , Sheet&, PauseButton&, (823, 204)-(861, 245)
    _PutImage , Sheet&, HazardBar&, (288, 393)-(749, 416)
    _PutImage (0, 0)-(431, 119), Sheet&, Clouds&, (424, 0)-(855, 119)
    _PutImage (432, 0)-(863, 119), Sheet&, Clouds&, (424, 0)-(855, 119)
    _PutImage (0, 0)-(431, 56), Sheet&, City&, (424, 120)-(855, 176)
    _PutImage (432, 0)-(863, 56), Sheet&, City&, (424, 120)-(855, 176)
    _PutImage (0, 0)-(431, 26), Sheet&, Bushes&, (424, 177)-(855, 203)
    _PutImage (432, 0)-(863, 26), Sheet&, Bushes&, (424, 177)-(855, 203)
    _PutImage , Sheet&, New&, (289, 363)-(336, 383)
    _PutImage , Sheet&, PipeTop&, (339, 189)-(416, 224)
    '_PutImage , Sheet&, PipeTube&, (339, 225)-(416, 260)
    _PutImage , Sheet&, PipeTube&, (339, 225)-(416, 260)
    _PutImage (0, 431)-(77, 395), PipeTop&, Pipe&(0) '         create bottom of upper tube image
    _PutImage (0, 0), PipeTop&, Pipe&(1) '                     create top of lower tube image
    For y% = 0 To 395 Step 36 '                                cycle through tube body of pipes
        _PutImage (0, y% + 35)-(77, y%), PipeTube&, Pipe&(0) ' draw tube on upper pipe image
        _PutImage (0, 36 + y%), PipeTube&, Pipe&(1) '          draw tube on lower pipe image
    Next y%
    _FreeImage PipeTop& '                                      temporary image no longer needed
    _FreeImage PipeTube& '                                     temporary image no longer needed
    _FreeImage Sheet& '                                        sprite sheet no longer needed
    'Clean& = _NewImage(432, 768, 32) '                         create clean image holder
    Clean& = _NewImage(_Width, _Height, 32)
    _Dest Clean& '                                             work on clean image
    Cls , _RGB32(84, 192, 201) '                               clear image with sky blue color
    Line (0, 620)-(431, 767), _RGB32(219, 218, 150), BF '      create brown ground portion of image
    Line (0, 577)-(431, 595), _RGB32(100, 224, 117), BF '      create green grass portion of image
    _Dest 0 '                                                  back to work on screen
    Scenery(1).image = Clouds& '                               set scenery parallax information
    Scenery(1).y = 457
    Scenery(1).fmax = 8
    Scenery(2).image = City&
    Scenery(2).y = 510
    Scenery(2).fmax = 4
    Scenery(3).image = Bushes&
    Scenery(3).y = 550
    Scenery(3).fmax = 2
    Scenery(4).image = HazardBar&
    Scenery(4).y = 596
    'If _FileExists("fbird.sco") Then '                         does high score file exist?
    '    Open "fbird.sco" For Input As #1 '                     yes, open high score file
    '    Input #1, HighScore% '                                 get high score from file
    '    Close #1 '                                             close high score file
    'End If

End Sub

'----------------------------------------------------------------------------------------------------------------------

Function BOXCOLLISION% (Box1X As Integer, Box1Y As Integer, Box1Width As Integer, Box1Height As Integer, Box2X As Integer, Box2Y As Integer, Box2Width As Integer, Box2Height As Integer)

    '**
    '** Detects if two bounding box areas are in collision
    '**
    '** INPUT : Box1X%      - upper left corner X location of bounding box 1
    '**         Box1Y%      - upper left corner Y location of bounding box 1
    '**         Box1Width%  - the width of bounding box 1
    '**         Box1Height% - the height of bounding box 1
    '**         Box2X%      - upper left corner X location of bounding box 2
    '**         Box2Y%      - upper left corner Y location of bounding box 2
    '**         Box2Width%  - the width of bounding box 2
    '**         Box2Height% - the height of bounding box 2
    '**
    '** OUTPUT: BOXCOLLISION - 0 (FALSE) for no collision, -1 (TRUE) for collision
    '**

    If Box1X <= Box2X + Box2Width - 1 Then '              is box1 x within lower limit of box2 x?
        If Box1X + Box1Width - 1 >= Box2X Then '          yes, is box1 x within upper limit of box2 x?
            If Box1Y <= Box2Y + Box2Height - 1 Then '     yes, is box1 y within lower limit of box2 y?
                If Box1Y + Box1Height - 1 >= Box2Y Then ' yes, is box1 y within upper limit of box2 y?
                    BOXCOLLISION = TRUE '                   yes, then a collision occured, return result
                End If
            End If
        End If
    End If

End Function

'----------------------------------------------------------------------------------------------------------------------

Sub CLEANUP ()

    '*
    '* Removes all game assets from the computer's RAM.
    '*

    'Shared Fbird&(), Pipe&(), Num&(), Medal&(), Plaque&, FlappyBird&, GameOver&, GetReady&
    'Shared Finger&, ScoreButton&, ShareButton&, StartButton&, OKButton&, RateButton&
    'Shared MenuButton&, PlayButton&, PauseButton&, HazardBar&, Clouds&, City&, Bushes&
    'Shared New&, Clean&, PipeImage&, Ding&, Flap&, Smack&

    Dim x% '              generic counter
    Dim y% '              generic counter

    _SndClose Ding& '                           remove game sounds from RAM
    _SndClose Flap&
    _SndClose Smack&
    For y% = 0 To 2 '                           cycle through bird image rows
        For x% = 0 To 7 '                       cycle through bird image columns
            _FreeImage Fbird&(x% + 1, y% + 1) ' remove bird image from RAM
        Next x%
    Next y%
    For x% = 0 To 9 '                           cycle trough 9 numeral images
        _FreeImage Num&(x%, 0) '                remove large numeral image from RAM
        _FreeImage Num&(x%, 1) '                remove small numeral image from RAM
    Next x%
    _FreeImage Plaque& '                        remove all remaining images from RAM
    _FreeImage FlappyBird&
    _FreeImage GameOver&
    _FreeImage GetReady&
    _FreeImage Pipe&(0)
    _FreeImage Pipe&(1)
    _FreeImage PipeImage&
    _FreeImage Medal&(0, 0)
    _FreeImage Medal&(0, 1)
    _FreeImage Medal&(1, 0)
    _FreeImage Medal&(1, 1)
    _FreeImage Finger&
    _FreeImage ScoreButton&
    _FreeImage ShareButton&
    _FreeImage StartButton&
    _FreeImage OKButton&
    _FreeImage RateButton&
    _FreeImage MenuButton&
    _FreeImage PlayButton&
    _FreeImage PauseButton&
    _FreeImage HazardBar&
    _FreeImage Clouds&
    _FreeImage City&
    _FreeImage Bushes&
    _FreeImage New&
    _FreeImage Clean&

End Sub

'----------------------------------------------------------------------------------------------------------------------
